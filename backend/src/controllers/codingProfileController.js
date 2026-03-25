const CodingProfile = require('../models/CodingProfile');
const { AppError } = require('../utils/errorHandler');

const platformUrlBuilders = {
  LeetCode: (username) => `https://leetcode.com/${username}`,
  CodeChef: (username) => `https://codechef.com/users/${username}`,
  HackerRank: (username) => `https://hackerrank.com/${username}`,
  Codeforces: (username) => `https://codeforces.com/profile/${username}`
};

const REQUEST_TIMEOUT_MS = 12000;

const toNumberOrNull = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const fetchWithTimeout = async (url, options = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'User-Agent': 'PlacementTracker/1.0',
        Accept: 'application/json, text/plain, */*',
        ...(options.headers || {})
      }
    });
  } finally {
    clearTimeout(timeoutId);
  }
};

const syncLeetCode = async (username) => {
  const response = await fetchWithTimeout('https://leetcode.com/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `
        query userPublicProfile($username: String!) {
          matchedUser(username: $username) {
            submitStatsGlobal {
              acSubmissionNum {
                difficulty
                count
              }
            }
          }
          userContestRanking(username: $username) {
            rating
          }
        }
      `,
      variables: { username }
    })
  });

  if (!response.ok) {
    throw new Error(`LeetCode request failed with ${response.status}`);
  }

  const payload = await response.json();
  const allNode = payload?.data?.matchedUser?.submitStatsGlobal?.acSubmissionNum?.find((item) => item?.difficulty === 'All');
  const solved = toNumberOrNull(allNode?.count);
  const rating = toNumberOrNull(payload?.data?.userContestRanking?.rating);

  if (solved == null && rating == null) {
    throw new Error('LeetCode stats not available');
  }

  return { solved, rating };
};

const syncCodeforces = async (username) => {
  const [infoResponse, statusResponse] = await Promise.all([
    fetchWithTimeout(`https://codeforces.com/api/user.info?handles=${encodeURIComponent(username)}`),
    fetchWithTimeout(`https://codeforces.com/api/user.status?handle=${encodeURIComponent(username)}&from=1&count=10000`)
  ]);

  if (!infoResponse.ok) {
    throw new Error(`Codeforces user.info failed with ${infoResponse.status}`);
  }
  if (!statusResponse.ok) {
    throw new Error(`Codeforces user.status failed with ${statusResponse.status}`);
  }

  const infoPayload = await infoResponse.json();
  const statusPayload = await statusResponse.json();

  if (infoPayload?.status !== 'OK') {
    throw new Error('Codeforces user.info returned non-OK status');
  }
  if (statusPayload?.status !== 'OK') {
    throw new Error('Codeforces user.status returned non-OK status');
  }

  const rating = toNumberOrNull(infoPayload?.result?.[0]?.rating);

  const solvedSet = new Set();
  for (const submission of statusPayload?.result || []) {
    if (submission?.verdict !== 'OK') continue;
    const problem = submission.problem || {};
    const key = `${problem.contestId || 'gym'}-${problem.index || problem.name || 'unknown'}`;
    solvedSet.add(key);
  }

  const solved = solvedSet.size;
  if (solved == null && rating == null) {
    throw new Error('Codeforces stats not available');
  }

  return { solved, rating };
};

const syncCodeChef = async (username) => {
  const response = await fetchWithTimeout(`https://www.codechef.com/users/${encodeURIComponent(username)}`);
  if (!response.ok) {
    throw new Error(`CodeChef request failed with ${response.status}`);
  }

  const html = await response.text();
  const ratingMatch = html.match(/"rating"\s*:\s*"?(\d+)"?/i);
  const solvedMatch = html.match(/"fully_solved"\s*:\s*"?(\d+)"?/i) || html.match(/"total_problems_solved"\s*:\s*"?(\d+)"?/i);

  const rating = toNumberOrNull(ratingMatch?.[1]);
  const solved = toNumberOrNull(solvedMatch?.[1]);

  if (solved == null && rating == null) {
    throw new Error('CodeChef stats not available');
  }

  return { solved, rating };
};

const syncHackerRank = async (username) => {
  const response = await fetchWithTimeout(`https://www.hackerrank.com/rest/hackers/${encodeURIComponent(username)}/profile`);
  if (!response.ok) {
    throw new Error(`HackerRank request failed with ${response.status}`);
  }

  const payload = await response.json();
  const model = payload?.model || {};
  const solved = toNumberOrNull(
    model?.solved_challenges
      || model?.solvedChallenges
      || model?.total_solved
      || model?.totalSolved
  );
  const rating = toNumberOrNull(
    model?.rating
      || model?.overall_rating
      || model?.overallRating
      || model?.score
  );

  if (solved == null && rating == null) {
    throw new Error('HackerRank stats not available');
  }

  return { solved, rating };
};

const fetchPlatformStats = async (platform, username) => {
  if (!username) throw new Error('Username is required for sync');

  if (platform === 'LeetCode') return syncLeetCode(username);
  if (platform === 'Codeforces') return syncCodeforces(username);
  if (platform === 'CodeChef') return syncCodeChef(username);
  if (platform === 'HackerRank') return syncHackerRank(username);

  throw new Error('Unsupported platform for sync');
};

const performProfileSync = async (profile) => {
  const username = extractUsername(profile.username || profile.profileUrl || '');
  if (!username) {
    profile.syncStatus = 'Failed';
    await profile.save();
    throw new Error('Unable to determine username for sync');
  }

  profile.username = username;
  profile.profileUrl = canonicalizeUrl(profile.platform, username);
  profile.syncStatus = 'Syncing';
  await profile.save();

  try {
    const { solved, rating } = await fetchPlatformStats(profile.platform, username);

    if (solved != null) profile.problemsSolved = solved;
    if (rating != null) profile.currentRating = rating;

    profile.lastSyncedAt = new Date();
    profile.syncStatus = 'Success';
    await profile.save();
    return profile;
  } catch (error) {
    profile.lastSyncedAt = new Date();
    profile.syncStatus = 'Failed';
    await profile.save();
    throw error;
  }
};

const extractUsername = (raw = '') => {
  const value = String(raw || '').trim();
  if (!value) return '';

  const parts = value.split('/').filter(Boolean);
  return (parts[parts.length - 1] || '').replace(/\?.*$/, '').replace(/#.*$/, '').trim();
};

const canonicalizeUrl = (platform, username) => {
  const builder = platformUrlBuilders[platform];
  if (!builder || !username) return '';
  return builder(username);
};

// Get all coding profiles
exports.getCodingProfiles = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check authorization
    if (req.user._id.toString() !== id && req.user.role !== 'admin') {
      return next(new AppError('You do not have permission to view these profiles', 403, 'UNAUTHORIZED'));
    }

    const profiles = await CodingProfile.find({ studentId: id });

    const normalizedProfiles = await Promise.all(profiles.map(async (profile) => {
      const profileObj = profile.toObject();
      const canonicalUsername = extractUsername(profileObj.username || profileObj.profileUrl || '');
      const canonicalUrl = canonicalizeUrl(profileObj.platform, canonicalUsername);

      if (canonicalUsername && (profile.username !== canonicalUsername || profile.profileUrl !== canonicalUrl)) {
        profile.username = canonicalUsername;
        profile.profileUrl = canonicalUrl;
        await profile.save();
      }

      const needsSync = !profile.lastSyncedAt
        || (profile.problemsSolved == null && profile.currentRating == null)
        || profile.syncStatus === 'Failed';

      if (needsSync) {
        try {
          await performProfileSync(profile);
        } catch (syncError) {
          console.error(`[CodingProfile] lazy sync failed for ${profile.platform}/${profile.username}:`, syncError.message);
        }
      }

      const latest = profile.toObject();

      return {
        ...latest,
        username: canonicalUsername || latest.username,
        profileUrl: canonicalUrl || latest.profileUrl
      };
    }));

    res.status(200).json({
      success: true,
      data: normalizedProfiles
    });
  } catch (error) {
    next(error);
  }
};

// Link coding profile
exports.linkProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { platform, username, profileUrl } = req.body;

    // Check authorization
    if (req.user._id.toString() !== id && req.user.role !== 'admin') {
      return next(new AppError('You do not have permission to link profiles', 403, 'UNAUTHORIZED'));
    }

    // Validation
    const validPlatforms = ['LeetCode', 'CodeChef', 'HackerRank', 'Codeforces'];
    if (!validPlatforms.includes(platform)) {
      return next(new AppError('Invalid platform', 400, 'VALIDATION_ERROR'));
    }

    const normalizedInput = String(profileUrl || username || '').trim();
    const extracted = extractUsername(normalizedInput);

    if (!extracted || extracted.length > 50) {
      return next(new AppError('Username must be between 1-50 characters', 400, 'VALIDATION_ERROR'));
    }

    // Check if profile already exists
    const existing = await CodingProfile.findOne({ studentId: id, platform });
    if (existing) {
      return next(new AppError('Profile already exists for this platform', 409, 'DUPLICATE_ENTRY'));
    }

    const canonicalUsername = extracted.replace(/\/$/, '');
    const canonicalUrl = canonicalizeUrl(platform, canonicalUsername);

    const profile = new CodingProfile({
      studentId: id,
      platform,
      username: canonicalUsername,
      profileUrl: canonicalUrl,
      syncStatus: 'Syncing'
    });

    await profile.save();

    try {
      await performProfileSync(profile);
    } catch (syncError) {
      console.error(`[CodingProfile] initial sync failed for ${platform}/${canonicalUsername}:`, syncError.message);
    }

    res.status(201).json({
      success: true,
      data: {
        profileId: profile._id,
        platform: profile.platform,
        username: profile.username,
        profileUrl: profile.profileUrl,
        problemsSolved: profile.problemsSolved,
        currentRating: profile.currentRating,
        syncStatus: profile.syncStatus,
        lastSyncedAt: profile.lastSyncedAt,
        linkedAt: profile.createdAt
      },
      message: 'Profile linked successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Refresh profile stats
exports.refreshProfile = async (req, res, next) => {
  try {
    const { id, platformId } = req.params;

    // Check authorization
    if (req.user._id.toString() !== id && req.user.role !== 'admin') {
      return next(new AppError('You do not have permission to sync profiles', 403, 'UNAUTHORIZED'));
    }

    const profile = await CodingProfile.findOne({ _id: platformId, studentId: id });

    if (!profile) {
      return next(new AppError('Profile not found', 404, 'NOT_FOUND'));
    }

    try {
      await performProfileSync(profile);
    } catch (syncError) {
      return next(new AppError(`Unable to sync ${profile.platform} stats right now. ${syncError.message}`, 502, 'SYNC_FAILED'));
    }

    res.status(200).json({
      success: true,
      data: {
        profileId: profile._id,
        platform: profile.platform,
        username: profile.username,
        problemsSolved: profile.problemsSolved,
        currentRating: profile.currentRating,
        syncStatus: profile.syncStatus,
        lastSyncedAt: profile.lastSyncedAt
      },
      message: 'Profile stats updated'
    });
  } catch (error) {
    next(error);
  }
};

// Unlink profile
exports.unlinkProfile = async (req, res, next) => {
  try {
    const { id, platformId } = req.params;

    // Check authorization
    if (req.user._id.toString() !== id && req.user.role !== 'admin') {
      return next(new AppError('You do not have permission to unlink profiles', 403, 'UNAUTHORIZED'));
    }

    const profile = await CodingProfile.findOneAndDelete({ _id: platformId, studentId: id });

    if (!profile) {
      return next(new AppError('Profile not found', 404, 'NOT_FOUND'));
    }

    res.status(200).json({
      success: true,
      message: 'Profile unlinked successfully'
    });
  } catch (error) {
    next(error);
  }
};
