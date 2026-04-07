const fs = require('fs/promises');
const fsSync = require('fs');
const path = require('path');
const os = require('os');
const { spawn, spawnSync } = require('child_process');

const SUPPORTED_LANGUAGES = [
  'Java',
  'Python',
  'JavaScript',
  'TypeScript',
  'C',
  'C++',
  'C#',
  'Go',
  'Rust',
  'Kotlin'
];

const commandProfiles = {
  Java: {
    compile: [{ command: 'javac', probeArgs: ['-version'] }],
    run: [{ command: 'java', probeArgs: ['-version'] }]
  },
  Python: {
    run: [
      { command: 'python', probeArgs: ['--version'], runArgs: (filePath) => [filePath] },
      { command: 'python3', probeArgs: ['--version'], runArgs: (filePath) => [filePath] },
      { command: 'py', probeArgs: ['-3', '--version'], runArgs: (filePath) => ['-3', filePath] }
    ]
  },
  JavaScript: {
    run: [{ command: 'node', probeArgs: ['--version'], runArgs: (filePath) => [filePath] }]
  },
  TypeScript: {
    compile: [{ command: 'tsc', probeArgs: ['--version'] }],
    run: [{ command: 'node', probeArgs: ['--version'] }],
    directRun: [{ command: 'ts-node', probeArgs: ['--version'], runArgs: (filePath) => [filePath] }]
  },
  C: {
    compile: [
      { command: 'gcc', probeArgs: ['--version'] },
      { command: 'clang', probeArgs: ['--version'] }
    ]
  },
  'C++': {
    compile: [
      { command: 'g++', probeArgs: ['--version'] },
      { command: 'clang++', probeArgs: ['--version'] }
    ]
  },
  'C#': {
    compile: [
      { command: 'csc', probeArgs: ['-help'] },
      { command: 'mcs', probeArgs: ['--version'] }
    ],
    run: [{ command: 'mono', probeArgs: ['--version'] }]
  },
  Go: {
    run: [{ command: 'go', probeArgs: ['version'], runArgs: (filePath) => ['run', filePath] }]
  },
  Rust: {
    compile: [{ command: 'rustc', probeArgs: ['--version'] }]
  },
  Kotlin: {
    compile: [{ command: 'kotlinc', probeArgs: ['-version'] }],
    run: [{ command: 'java', probeArgs: ['-version'] }]
  }
};

const cloudCompilerProfiles = {
  TypeScript: { language: 'typescript', version: '5.6.3', fileName: 'main.ts' },
  C: { language: 'c', version: '10.2.0', fileName: 'main.c' },
  'C++': { language: 'c++', version: '10.2.0', fileName: 'main.cpp' },
  Rust: { language: 'rust', version: '1.89.0', fileName: 'main.rs' },
  Kotlin: { language: 'kotlin', version: '1.9.0', fileName: 'main.kt' },
  'C#': { language: 'csharp', version: '6.12.0', fileName: 'Program.cs' },
  Go: { language: 'go', version: '1.22.0', fileName: 'main.go' }
};

const CLOUD_COMPILER_API_URL = process.env.CLOUD_COMPILER_API_URL || 'https://emkc.org/api/v2/piston/execute';
const ENABLE_CLOUD_COMPILER_FALLBACK = process.env.ENABLE_CLOUD_COMPILER_FALLBACK === 'true';

const isCloudCompilerSupported = (language) => ENABLE_CLOUD_COMPILER_FALLBACK && Boolean(cloudCompilerProfiles[language]);

const safeResolve = (modulePath) => {
  try {
    return require.resolve(modulePath);
  } catch {
    return null;
  }
};

const getTypeScriptLocalCandidates = () => {
  const tscBin = safeResolve('typescript/bin/tsc');
  const tsNodeBin = safeResolve('ts-node/dist/bin.js');

  const compile = [];
  const directRun = [];

  if (tscBin) {
    compile.push({
      command: process.execPath,
      probeArgs: [tscBin, '--version'],
      runArgs: (args = []) => [tscBin, ...args],
      displayCommand: 'node typescript/bin/tsc'
    });
  }

  if (tsNodeBin) {
    directRun.push({
      command: process.execPath,
      probeArgs: [tsNodeBin, '--version'],
      runArgs: (filePath) => [tsNodeBin, filePath],
      displayCommand: 'node ts-node/dist/bin.js'
    });
  }

  return { compile, directRun };
};

const getTypeScriptCandidates = () => {
  const local = getTypeScriptLocalCandidates();
  return {
    compile: [...(commandProfiles.TypeScript.compile || []), ...local.compile],
    run: commandProfiles.TypeScript.run || [],
    directRun: [...(commandProfiles.TypeScript.directRun || []), ...local.directRun]
  };
};

const getBundledKotlinCompileCandidates = () => {
  const kotlincExecutable = process.platform === 'win32' ? 'kotlinc.bat' : 'kotlinc';
  const bundledPath = path.join(__dirname, '..', '..', 'tools', 'kotlin', 'kotlinc', 'bin', kotlincExecutable);

  if (!fsSync.existsSync(bundledPath)) return [];

  if (process.platform === 'win32') {
    return [{
      ...wrapWindowsBatchCommand(bundledPath, '-version'),
      pathToCheck: bundledPath
    }];
  }

  return [{
    command: bundledPath,
    probeArgs: ['-version'],
    displayCommand: bundledPath
  }];
};

const getKotlinCandidates = () => ({
  compile: [...(commandProfiles.Kotlin.compile || []), ...getBundledKotlinCompileCandidates()],
  run: commandProfiles.Kotlin.run || []
});

const getMingwBinPath = () => {
  if (process.platform !== 'win32') return null;

  const explicit = process.env.MINGW_BIN_PATH;
  if (explicit && fsSync.existsSync(explicit)) return explicit;

  try {
    const packagesRoot = path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'WinGet', 'Packages');
    if (!fsSync.existsSync(packagesRoot)) return null;

    const mingwPackage = fsSync.readdirSync(packagesRoot).find((entry) => entry.startsWith('MartinStorsjo.LLVM-MinGW.UCRT_'));
    if (!mingwPackage) return null;

    const packageDir = path.join(packagesRoot, mingwPackage);
    const extracted = fsSync.readdirSync(packageDir).find((entry) => entry.startsWith('llvm-mingw-') && entry.includes('-ucrt-'));
    if (!extracted) return null;

    const binPath = path.join(packageDir, extracted, 'bin');
    return fsSync.existsSync(binPath) ? binPath : null;
  } catch {
    return null;
  }
};

const getWinlibsBinPath = () => {
  if (process.platform !== 'win32') return null;

  try {
    const packagesRoot = path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'WinGet', 'Packages');
    if (!fsSync.existsSync(packagesRoot)) return null;

    const winlibsPackage = fsSync.readdirSync(packagesRoot).find((entry) => entry.startsWith('BrechtSanders.WinLibs.POSIX.UCRT.LLVM_'));
    if (!winlibsPackage) return null;

    const packageRoot = path.join(packagesRoot, winlibsPackage, 'mingw64');
    const binPath = path.join(packageRoot, 'bin');
    if (!fsSync.existsSync(binPath)) return null;

    // Some WinLibs builds are missing stdlib internals (e.g., bits/error_constants.h).
    // Skip these broken toolchains so we can fall back to a healthy compiler.
    const cppIncludeRoot = path.join(packageRoot, 'include', 'c++');
    if (fsSync.existsSync(cppIncludeRoot)) {
      const versions = fsSync.readdirSync(cppIncludeRoot, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name);

      const hasRequiredHeader = versions.some((versionDir) => fsSync.existsSync(path.join(cppIncludeRoot, versionDir, 'bits', 'error_constants.h')));
      if (!hasRequiredHeader) return null;
    }

    return binPath;
  } catch {
    return null;
  }
};

function wrapWindowsBatchCommand(batchPath, probeFlag = '--version') {
  return {
    command: 'cmd',
    probeArgs: ['/c', batchPath, probeFlag],
    runArgs: (args = []) => ['/c', batchPath, ...args],
    displayCommand: batchPath
  };
}

const ifExists = (candidate) => {
  if (!candidate?.command) return null;
  const pathToCheck = candidate.pathToCheck || candidate.command;
  return fsSync.existsSync(pathToCheck) ? candidate : null;
};

const getCCompileCandidates = () => {
  const candidates = [...(commandProfiles.C.compile || [])];
  if (process.platform === 'win32') {
    const winlibsBin = getWinlibsBinPath();
    if (winlibsBin) {
      const winlibsGcc = ifExists({
        command: path.join(winlibsBin, 'gcc.exe'),
        probeArgs: ['--version']
      });
      if (winlibsGcc) candidates.unshift(winlibsGcc);
    }

    const mingwBin = getMingwBinPath();
    if (mingwBin) {
      const mingwGcc = ifExists({
        command: path.join(mingwBin, 'gcc.exe'),
        probeArgs: ['--version']
      });
      if (mingwGcc) candidates.unshift(mingwGcc);
    }

    const llvmClang = ifExists({
      command: path.join(process.env.ProgramFiles || 'C:\\Program Files', 'LLVM', 'bin', 'clang.exe'),
      probeArgs: ['--version']
    });
    if (llvmClang) candidates.push(llvmClang);
  }
  return candidates;
};

const getCppCompileCandidates = () => {
  const candidates = [...(commandProfiles['C++'].compile || [])];
  if (process.platform === 'win32') {
    const winlibsBin = getWinlibsBinPath();
    if (winlibsBin) {
      const winlibsGpp = ifExists({
        command: path.join(winlibsBin, 'g++.exe'),
        probeArgs: ['--version']
      });
      if (winlibsGpp) candidates.unshift(winlibsGpp);
    }

    const mingwBin = getMingwBinPath();
    if (mingwBin) {
      const mingwGpp = ifExists({
        command: path.join(mingwBin, 'g++.exe'),
        probeArgs: ['--version']
      });
      if (mingwGpp) candidates.unshift(mingwGpp);
    }

    const llvmClangCpp = ifExists({
      command: path.join(process.env.ProgramFiles || 'C:\\Program Files', 'LLVM', 'bin', 'clang++.exe'),
      probeArgs: ['--version']
    });
    if (llvmClangCpp) candidates.push(llvmClangCpp);
  }
  return candidates;
};

const getCSharpCandidates = () => {
  const compile = [...(commandProfiles['C#'].compile || [])];
  const run = [...(commandProfiles['C#'].run || [])];

  if (process.platform === 'win32') {
    const monoBase = path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Mono', 'bin');
    const mcsBatPath = path.join(monoBase, 'mcs.bat');
    const cscBatPath = path.join(monoBase, 'csc.bat');
    const mcsBat = ifExists({ ...wrapWindowsBatchCommand(mcsBatPath), pathToCheck: mcsBatPath });
    const cscBat = ifExists({ ...wrapWindowsBatchCommand(cscBatPath, '-help'), pathToCheck: cscBatPath });
    const mcsExe = ifExists({ command: path.join(monoBase, 'mcs.exe'), probeArgs: ['--version'] });
    const monoExe = ifExists({ command: path.join(monoBase, 'mono.exe'), probeArgs: ['--version'] });

    if (mcsBat) compile.push(mcsBat);
    if (cscBat) compile.push(cscBat);
    if (mcsExe) compile.push(mcsExe);
    if (monoExe) run.push(monoExe);
  }

  return { compile, run };
};

const getGoRunCandidates = () => {
  const candidates = [...(commandProfiles.Go.run || [])];
  if (process.platform === 'win32') {
    const goExe = ifExists({
      command: path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Go', 'bin', 'go.exe'),
      probeArgs: ['version'],
      runArgs: (filePath) => ['run', filePath]
    });
    if (goExe) candidates.push(goExe);
  }
  return candidates;
};

const getRustCompileCandidates = () => {
  const candidates = [...(commandProfiles.Rust.compile || [])];
  if (process.platform === 'win32') {
    const rustcExe = ifExists({
      command: path.join(process.env.USERPROFILE || '', '.cargo', 'bin', 'rustc.exe'),
      probeArgs: ['--version']
    });
    let programFilesRust = null;
    try {
      const entries = fsSync.readdirSync(process.env.ProgramFiles || 'C:\\Program Files');
      const rustCandidates = entries.filter((entry) => /^Rust\s/i.test(entry) && fsSync.existsSync(path.join(process.env.ProgramFiles || 'C:\\Program Files', entry, 'bin', 'rustc.exe')));
      const rustFolder = rustCandidates.find((entry) => /gnu/i.test(entry)) || rustCandidates[0];
      if (rustFolder) {
        programFilesRust = ifExists({
          command: path.join(process.env.ProgramFiles || 'C:\\Program Files', rustFolder, 'bin', 'rustc.exe'),
          probeArgs: ['--version']
        });
      }
    } catch {
      programFilesRust = null;
    }

    if (rustcExe) candidates.push(rustcExe);
    if (programFilesRust) candidates.push(programFilesRust);
  }
  return candidates;
};

const getResolvedProfile = (language) => {
  if (language === 'TypeScript') return getTypeScriptCandidates();
  if (language === 'Kotlin') return getKotlinCandidates();
  if (language === 'C') return { compile: getCCompileCandidates() };
  if (language === 'C++') return { compile: getCppCompileCandidates() };
  if (language === 'C#') return getCSharpCandidates();
  if (language === 'Go') return { run: getGoRunCandidates() };
  if (language === 'Rust') return { compile: getRustCompileCandidates() };
  return commandProfiles[language] || {};
};

const hasCommand = (candidate) => {
  const probe = spawnSync(candidate.command, candidate.probeArgs || ['--version'], {
    stdio: 'ignore',
    shell: false
  });

  return !probe.error;
};

const isUsableCppCompiler = (candidate) => {
  if (!candidate?.command) return false;

  const probe = spawnSync(candidate.command, ['-x', 'c++', '-std=c++17', '-fsyntax-only', '-'], {
    input: '#include <system_error>\nint main(){return 0;}\n',
    stdio: ['pipe', 'ignore', 'ignore'],
    shell: false,
    timeout: 5000
  });

  return !probe.error && probe.status === 0;
};

const isUsablePythonRuntime = (candidate) => {
  if (!candidate?.command) return false;

  const lowered = String(candidate.command || '').toLowerCase();
  const probeArgs = lowered === 'py'
    ? ['-3', '-c', 'print("ok")']
    : ['-c', 'print("ok")'];

  const probe = spawnSync(candidate.command, probeArgs, {
    stdio: 'ignore',
    shell: false,
    timeout: 5000
  });

  return !probe.error && probe.status === 0;
};

const pickCompileCommand = (language, candidates = []) => {
  if (language !== 'C++') return pickCommand(candidates);

  for (const candidate of candidates) {
    if (!hasCommand(candidate)) continue;
    if (isUsableCppCompiler(candidate)) return candidate;
  }

  return null;
};

const pickRunCommand = (language, candidates = []) => {
  if (language !== 'Python') return pickCommand(candidates);

  for (const candidate of candidates) {
    if (!hasCommand(candidate)) continue;
    if (isUsablePythonRuntime(candidate)) return candidate;
  }

  return null;
};

const pickCommand = (candidates = []) => {
  for (const candidate of candidates) {
    if (hasCommand(candidate)) return candidate;
  }
  return null;
};

const missingToolchainResult = (phase, message) => ({
  success: false,
  phase,
  stdout: '',
  stderr: message,
  errors: [message],
  exitCode: 1,
  timedOut: false
});

const executeInCloudCompiler = async ({ language, code, input = '', timeoutMs = 6000 }) => {
  const profile = cloudCompilerProfiles[language];
  if (!profile) return null;

  try {
    const response = await fetch(CLOUD_COMPILER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        language: profile.language,
        version: profile.version,
        files: [{
          name: profile.fileName,
          content: code
        }],
        stdin: input,
        compile_timeout: Math.min(timeoutMs, 15000),
        run_timeout: Math.min(timeoutMs, 15000)
      })
    });

    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    const compile = payload?.compile || {};
    const run = payload?.run || {};

    const compileFailed = typeof compile.code === 'number' && compile.code !== 0;
    const runFailed = typeof run.code === 'number' && run.code !== 0;
    const timedOut = String(run.signal || '').toUpperCase().includes('TIME');

    if (compileFailed) {
      const compileStderr = String(compile.stderr || compile.output || 'Compilation failed.').trim();
      const errors = parseCompilerMessages(compileStderr);

      return {
        success: false,
        phase: 'compile',
        stdout: String(compile.stdout || ''),
        stderr: compileStderr,
        errors: errors.length ? errors : [compileStderr],
        exitCode: compile.code,
        timedOut: false,
        executedInCloud: true
      };
    }

    const runtimeStderr = String(run.stderr || '').trim();
    const runtimeOutput = String(run.output || run.stdout || '').trim();
    const errors = parseCompilerMessages(runtimeStderr);

    return {
      success: !runFailed && !timedOut,
      phase: 'run',
      stdout: runtimeOutput,
      stderr: timedOut ? 'Execution timed out.' : runtimeStderr,
      errors,
      exitCode: typeof run.code === 'number' ? run.code : (runFailed ? 1 : 0),
      timedOut,
      executedInCloud: true
    };
  } catch {
    return null;
  }
};

const resolveToolchainOrCloud = async ({ language, code, input, timeoutMs, phase, message }) => {
  if (!isCloudCompilerSupported(language)) {
    return missingToolchainResult(phase, message);
  }

  const cloudResult = await executeInCloudCompiler({ language, code, input, timeoutMs });
  if (cloudResult) return cloudResult;
  return missingToolchainResult(phase, message);
};

const runProcess = ({ command, args, cwd, stdin = '', timeoutMs = 6000 }) => {
  return new Promise((resolve) => {
    const extraPaths = [];
    const winlibsBin = getWinlibsBinPath();
    if (winlibsBin) extraPaths.push(winlibsBin);

    const mingwBin = getMingwBinPath();
    if (mingwBin) extraPaths.push(mingwBin);

    const rustMsvcBin = path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Rust stable MSVC 1.94', 'bin');
    const rustGnuBin = path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Rust stable GNU 1.94', 'bin');
    if (fsSync.existsSync(rustMsvcBin)) extraPaths.push(rustMsvcBin);
    if (fsSync.existsSync(rustGnuBin)) extraPaths.push(rustGnuBin);

    const goBin = path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Go', 'bin');
    if (fsSync.existsSync(goBin)) extraPaths.push(goBin);

    const mergedPath = [...extraPaths, process.env.PATH || ''].join(path.delimiter);
    const child = spawn(command, args, { cwd, shell: false, env: { ...process.env, PATH: mergedPath } });
    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, timeoutMs);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      clearTimeout(timer);
      resolve({
        exitCode: 1,
        stdout,
        stderr: `${stderr}\n${error.message}`.trim(),
        timedOut
      });
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({
        exitCode: typeof code === 'number' ? code : 1,
        stdout,
        stderr,
        timedOut
      });
    });

    if (stdin) child.stdin.write(stdin);
    child.stdin.end();
  });
};

const parseCompilerMessages = (text) => {
  const lines = String(text || '').split('\n').map((line) => line.trim()).filter(Boolean);
  const messages = [];

  for (const line of lines) {
    const generic = line.match(/:(\d+):(?:(\d+):)?\s*(error|warning|note)?\s*(.*)$/i);
    if (generic) {
      const lineNumber = Number(generic[1]);
      const detail = (generic[4] || line).trim();
      messages.push(`Line ${lineNumber}: ${detail || line}`);
      continue;
    }

    const python = line.match(/line\s+(\d+)/i);
    if (python) {
      messages.push(`Line ${Number(python[1])}: ${line}`);
      continue;
    }

    if (/error|exception|syntax/i.test(line)) {
      messages.push(line);
    }
  }

  return Array.from(new Set(messages));
};

const getJavaClassName = (code) => {
  const publicClass = String(code).match(/public\s+class\s+([A-Za-z_]\w*)/);
  if (publicClass) return publicClass[1];

  const anyClass = String(code).match(/class\s+([A-Za-z_]\w*)/);
  if (anyClass) return anyClass[1];

  return 'Main';
};

const hasJavaMainMethod = (code) => /public\s+static\s+void\s+main\s*\(\s*String\s*\[\s*\]\s*\w+\s*\)/.test(String(code));
const hasCMain = (code) => /\bint\s+main\s*\(/.test(String(code));
const hasCppMain = (code) => /\bint\s+main\s*\(/.test(String(code));
const hasCSharpMain = (code) => /\bstatic\s+void\s+Main\s*\(/.test(String(code));

const getKotlinMainFileName = (code) => {
  const fileClass = String(code).match(/class\s+([A-Za-z_]\w*)/);
  if (fileClass) return `${fileClass[1]}.kt`;
  return 'Main.kt';
};

const getBinaryPath = (tempDir, baseName) => path.join(tempDir, process.platform === 'win32' ? `${baseName}.exe` : baseName);

const getAvailableToolchains = () => {
  return SUPPORTED_LANGUAGES.map((language) => {
    const profile = getResolvedProfile(language);
    const compile = pickCompileCommand(language, profile.compile || []);
    const run = pickRunCommand(language, profile.run || []);
    const directRun = pickCommand(profile.directRun || []);

    const compileRequired = Array.isArray(profile.compile) && profile.compile.length > 0;
    const runRequired = Array.isArray(profile.run) && profile.run.length > 0;
    const hasDirectRunFallback = Array.isArray(profile.directRun) && profile.directRun.length > 0;

    const localAvailable =
      (compileRequired ? Boolean(compile) : true) &&
      (runRequired ? Boolean(run) : true) ||
      (hasDirectRunFallback && Boolean(directRun));

    const cloudAvailable = isCloudCompilerSupported(language);
    const available = localAvailable || cloudAvailable;

    const compileCommand = compile?.displayCommand || compile?.command || (cloudAvailable ? 'cloud-compiler' : null);
    const runCommand = run?.displayCommand || run?.command || directRun?.displayCommand || directRun?.command || (cloudAvailable ? 'cloud-compiler' : null);

    const notes = localAvailable
      ? 'Ready'
      : cloudAvailable
        ? 'Ready (cloud fallback enabled)'
        : 'Compiler/runtime not found on server';

    return {
      language,
      available,
      compileCommand,
      runCommand,
      notes
    };
  });
};

const executeCode = async ({ language, code, input = '', timeoutMs = 6000 }) => {
  if (!SUPPORTED_LANGUAGES.includes(language)) {
    return {
      success: false,
      phase: 'validation',
      stdout: '',
      stderr: `Unsupported language: ${language}`,
      errors: [`Unsupported language: ${language}`],
      exitCode: 1,
      timedOut: false
    };
  }

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ppt-compile-'));

  try {
    if (language === 'Java') {
      const compileCandidate = pickCommand(commandProfiles.Java.compile);
      const runCandidate = pickCommand(commandProfiles.Java.run);
      if (!compileCandidate || !runCandidate) {
        return missingToolchainResult('compile', 'Java compiler/runtime not found on server (javac/java).');
      }

      const className = getJavaClassName(code);
      const sourceFile = path.join(tempDir, `${className}.java`);
      await fs.writeFile(sourceFile, code, 'utf8');

      const compile = await runProcess({
        command: compileCandidate.command,
        args: [sourceFile],
        cwd: tempDir,
        timeoutMs
      });

      if (compile.exitCode !== 0 || compile.timedOut) {
        const errors = parseCompilerMessages(compile.stderr);
        return {
          success: false,
          phase: 'compile',
          stdout: compile.stdout,
          stderr: compile.timedOut ? 'Compilation timed out.' : compile.stderr,
          errors: errors.length ? errors : [compile.timedOut ? 'Compilation timed out.' : 'Compilation failed.'],
          exitCode: compile.exitCode,
          timedOut: compile.timedOut
        };
      }

      if (!hasJavaMainMethod(code)) {
        return {
          success: true,
          phase: 'compile',
          stdout: 'Compilation successful. Function-style Java solution detected (no main method). Runtime execution skipped.',
          stderr: '',
          errors: [],
          exitCode: 0,
          timedOut: false,
          functionMode: true
        };
      }

      const run = await runProcess({
        command: runCandidate.command,
        args: ['-cp', tempDir, className],
        cwd: tempDir,
        stdin: input,
        timeoutMs
      });

      const runtimeErrors = parseCompilerMessages(run.stderr);
      return {
        success: run.exitCode === 0 && !run.timedOut,
        phase: 'run',
        stdout: run.stdout,
        stderr: run.timedOut ? 'Execution timed out.' : run.stderr,
        errors: runtimeErrors,
        exitCode: run.exitCode,
        timedOut: run.timedOut
      };
    }

    if (language === 'Python') {
      const runner = pickRunCommand(language, commandProfiles.Python.run);
      if (!runner) {
        return missingToolchainResult('run', 'Python runtime not found on server.');
      }

      const sourceFile = path.join(tempDir, 'main.py');
      await fs.writeFile(sourceFile, code, 'utf8');

      const run = await runProcess({
        command: runner.command,
        args: runner.runArgs ? runner.runArgs(sourceFile) : [sourceFile],
        cwd: tempDir,
        stdin: input,
        timeoutMs
      });

      return {
        success: run.exitCode === 0 && !run.timedOut,
        phase: 'run',
        stdout: run.stdout,
        stderr: run.timedOut ? 'Execution timed out.' : run.stderr,
        errors: parseCompilerMessages(run.stderr),
        exitCode: run.exitCode,
        timedOut: run.timedOut
      };
    }

    if (language === 'JavaScript') {
      const runner = pickCommand(commandProfiles.JavaScript.run);
      if (!runner) {
        return missingToolchainResult('run', 'Node.js runtime not found on server.');
      }

      const sourceFile = path.join(tempDir, 'main.js');
      await fs.writeFile(sourceFile, code, 'utf8');

      const run = await runProcess({
        command: runner.command,
        args: runner.runArgs ? runner.runArgs(sourceFile) : [sourceFile],
        cwd: tempDir,
        stdin: input,
        timeoutMs
      });

      return {
        success: run.exitCode === 0 && !run.timedOut,
        phase: 'run',
        stdout: run.stdout,
        stderr: run.timedOut ? 'Execution timed out.' : run.stderr,
        errors: parseCompilerMessages(run.stderr),
        exitCode: run.exitCode,
        timedOut: run.timedOut
      };
    }

    if (language === 'TypeScript') {
      const tsCandidates = getTypeScriptCandidates();
      const directRunner = pickCommand(tsCandidates.directRun);
      if (directRunner) {
        const sourceFile = path.join(tempDir, 'main.ts');
        await fs.writeFile(sourceFile, code, 'utf8');

        const run = await runProcess({
          command: directRunner.command,
          args: directRunner.runArgs ? directRunner.runArgs(sourceFile) : [sourceFile],
          cwd: tempDir,
          stdin: input,
          timeoutMs
        });

        return {
          success: run.exitCode === 0 && !run.timedOut,
          phase: 'run',
          stdout: run.stdout,
          stderr: run.timedOut ? 'Execution timed out.' : run.stderr,
          errors: parseCompilerMessages(run.stderr),
          exitCode: run.exitCode,
          timedOut: run.timedOut
        };
      }

      const compileCandidate = pickCommand(tsCandidates.compile);
      const runCandidate = pickCommand(tsCandidates.run);
      if (!compileCandidate || !runCandidate) {
        return resolveToolchainOrCloud({
          language,
          code,
          input,
          timeoutMs,
          phase: 'compile',
          message: 'TypeScript toolchain not found (tsc + node or ts-node).'
        });
      }

      const sourceFile = path.join(tempDir, 'main.ts');
      await fs.writeFile(sourceFile, code, 'utf8');

      const compile = await runProcess({
        command: compileCandidate.command,
        args: compileCandidate.runArgs
          ? compileCandidate.runArgs(['--target', 'ES2020', '--module', 'commonjs', '--outDir', tempDir, sourceFile])
          : ['--target', 'ES2020', '--module', 'commonjs', '--outDir', tempDir, sourceFile],
        cwd: tempDir,
        timeoutMs
      });

      if (compile.exitCode !== 0 || compile.timedOut) {
        const errors = parseCompilerMessages(compile.stderr);
        return {
          success: false,
          phase: 'compile',
          stdout: compile.stdout,
          stderr: compile.timedOut ? 'Compilation timed out.' : compile.stderr,
          errors: errors.length ? errors : [compile.timedOut ? 'Compilation timed out.' : 'Compilation failed.'],
          exitCode: compile.exitCode,
          timedOut: compile.timedOut
        };
      }

      const outputFile = path.join(tempDir, 'main.js');
      const run = await runProcess({
        command: runCandidate.command,
        args: [outputFile],
        cwd: tempDir,
        stdin: input,
        timeoutMs
      });

      return {
        success: run.exitCode === 0 && !run.timedOut,
        phase: 'run',
        stdout: run.stdout,
        stderr: run.timedOut ? 'Execution timed out.' : run.stderr,
        errors: parseCompilerMessages(run.stderr),
        exitCode: run.exitCode,
        timedOut: run.timedOut
      };
    }

    if (language === 'C') {
      const compileCandidate = pickCommand(getCCompileCandidates());
      if (!compileCandidate) {
        return resolveToolchainOrCloud({
          language,
          code,
          input,
          timeoutMs,
          phase: 'compile',
          message: 'C compiler not found on server (gcc/clang).'
        });
      }

      const sourceFile = path.join(tempDir, 'main.c');
      const outFile = getBinaryPath(tempDir, 'main_c');
      await fs.writeFile(sourceFile, code, 'utf8');

      const cHasMain = hasCMain(code);
      const compileArgs = cHasMain
        ? [sourceFile, '-O2', '-std=c17', '-o', outFile]
        : [sourceFile, '-O2', '-std=c17', '-c', '-o', path.join(tempDir, 'main_c.o')];

      const compile = await runProcess({
        command: compileCandidate.command,
        args: compileArgs,
        cwd: tempDir,
        timeoutMs
      });

      if (compile.exitCode !== 0 || compile.timedOut) {
        const errors = parseCompilerMessages(compile.stderr);
        return {
          success: false,
          phase: 'compile',
          stdout: compile.stdout,
          stderr: compile.timedOut ? 'Compilation timed out.' : compile.stderr,
          errors: errors.length ? errors : [compile.timedOut ? 'Compilation timed out.' : 'Compilation failed.'],
          exitCode: compile.exitCode,
          timedOut: compile.timedOut
        };
      }

      if (!cHasMain) {
        return {
          success: true,
          phase: 'compile',
          stdout: 'Compilation successful. Function-style C solution detected (no main function). Runtime execution skipped.',
          stderr: '',
          errors: [],
          exitCode: 0,
          timedOut: false,
          functionMode: true
        };
      }

      const run = await runProcess({
        command: outFile,
        args: [],
        cwd: tempDir,
        stdin: input,
        timeoutMs
      });

      return {
        success: run.exitCode === 0 && !run.timedOut,
        phase: 'run',
        stdout: run.stdout,
        stderr: run.timedOut ? 'Execution timed out.' : run.stderr,
        errors: parseCompilerMessages(run.stderr),
        exitCode: run.exitCode,
        timedOut: run.timedOut
      };
    }

    if (language === 'C++') {
      const compileCandidate = pickCompileCommand(language, getCppCompileCandidates());
      if (!compileCandidate) {
        return resolveToolchainOrCloud({
          language,
          code,
          input,
          timeoutMs,
          phase: 'compile',
          message: 'C++ compiler not found on server (g++/clang++).'
        });
      }

      const sourceFile = path.join(tempDir, 'main.cpp');
      const outFile = getBinaryPath(tempDir, 'main_cpp');
      await fs.writeFile(sourceFile, code, 'utf8');

      const cppHasMain = hasCppMain(code);
      const cppThreadLinkArgs = process.platform === 'win32' && cppHasMain ? ['-pthread'] : [];
      const compileArgs = cppHasMain
        ? [sourceFile, '-O2', '-std=c++17', ...cppThreadLinkArgs, '-o', outFile]
        : [sourceFile, '-O2', '-std=c++17', '-c', '-o', path.join(tempDir, 'main_cpp.o')];

      const compile = await runProcess({
        command: compileCandidate.command,
        args: compileArgs,
        cwd: tempDir,
        timeoutMs
      });

      if (compile.exitCode !== 0 || compile.timedOut) {
        const errors = parseCompilerMessages(compile.stderr);
        return {
          success: false,
          phase: 'compile',
          stdout: compile.stdout,
          stderr: compile.timedOut ? 'Compilation timed out.' : compile.stderr,
          errors: errors.length ? errors : [compile.timedOut ? 'Compilation timed out.' : 'Compilation failed.'],
          exitCode: compile.exitCode,
          timedOut: compile.timedOut
        };
      }

      if (!cppHasMain) {
        return {
          success: true,
          phase: 'compile',
          stdout: 'Compilation successful. Function-style C++ solution detected (no main function). Runtime execution skipped.',
          stderr: '',
          errors: [],
          exitCode: 0,
          timedOut: false,
          functionMode: true
        };
      }

      const run = await runProcess({
        command: outFile,
        args: [],
        cwd: tempDir,
        stdin: input,
        timeoutMs
      });

      return {
        success: run.exitCode === 0 && !run.timedOut,
        phase: 'run',
        stdout: run.stdout,
        stderr: run.timedOut ? 'Execution timed out.' : run.stderr,
        errors: parseCompilerMessages(run.stderr),
        exitCode: run.exitCode,
        timedOut: run.timedOut
      };
    }

    if (language === 'C#') {
      const csharpCandidates = getCSharpCandidates();
      const compileCandidate = pickCommand(csharpCandidates.compile);
      if (!compileCandidate) {
        return resolveToolchainOrCloud({
          language,
          code,
          input,
          timeoutMs,
          phase: 'compile',
          message: 'C# compiler not found on server (csc/mcs).'
        });
      }

      const sourceFile = path.join(tempDir, 'Program.cs');
      const outFile = getBinaryPath(tempDir, 'Program');
      await fs.writeFile(sourceFile, code, 'utf8');

      const csharpHasMain = hasCSharpMain(code);
      const compileName = String(compileCandidate.displayCommand || compileCandidate.command || '').toLowerCase();
      const usesMcs = compileName.includes('mcs');
      const compileArgsRaw = usesMcs
        ? (csharpHasMain ? [sourceFile, '-out:' + outFile] : [sourceFile, '-target:library', '-out:' + path.join(tempDir, 'Program.dll')])
        : (csharpHasMain ? ['/nologo', '/out:' + outFile, sourceFile] : ['/nologo', '/target:library', '/out:' + path.join(tempDir, 'Program.dll'), sourceFile]);
      const compileArgs = compileCandidate.runArgs ? compileCandidate.runArgs(compileArgsRaw) : compileArgsRaw;

      const compile = await runProcess({
        command: compileCandidate.command,
        args: compileArgs,
        cwd: tempDir,
        timeoutMs
      });

      if (compile.exitCode !== 0 || compile.timedOut) {
        const errors = parseCompilerMessages(compile.stderr || compile.stdout);
        return {
          success: false,
          phase: 'compile',
          stdout: compile.stdout,
          stderr: compile.timedOut ? 'Compilation timed out.' : (compile.stderr || compile.stdout),
          errors: errors.length ? errors : [compile.timedOut ? 'Compilation timed out.' : 'Compilation failed.'],
          exitCode: compile.exitCode,
          timedOut: compile.timedOut
        };
      }

      if (!csharpHasMain) {
        return {
          success: true,
          phase: 'compile',
          stdout: 'Compilation successful. Function-style C# solution detected (no Main method). Runtime execution skipped.',
          stderr: '',
          errors: [],
          exitCode: 0,
          timedOut: false,
          functionMode: true
        };
      }

      let runCommand = outFile;
      let runArgs = [];
      if (usesMcs) {
        const monoRunner = pickCommand(csharpCandidates.run);
        if (!monoRunner) {
          return missingToolchainResult('run', 'Mono runtime not found for C# execution.');
        }
        runCommand = monoRunner.command;
        runArgs = monoRunner.runArgs ? monoRunner.runArgs([outFile]) : [outFile];
      }

      const run = await runProcess({
        command: runCommand,
        args: runArgs,
        cwd: tempDir,
        stdin: input,
        timeoutMs
      });

      return {
        success: run.exitCode === 0 && !run.timedOut,
        phase: 'run',
        stdout: run.stdout,
        stderr: run.timedOut ? 'Execution timed out.' : run.stderr,
        errors: parseCompilerMessages(run.stderr),
        exitCode: run.exitCode,
        timedOut: run.timedOut
      };
    }

    if (language === 'Go') {
      const runner = pickCommand(getGoRunCandidates());
      if (!runner) {
        return resolveToolchainOrCloud({
          language,
          code,
          input,
          timeoutMs,
          phase: 'run',
          message: 'Go runtime not found on server (go).'
        });
      }

      const sourceFile = path.join(tempDir, 'main.go');
      await fs.writeFile(sourceFile, code, 'utf8');

      const run = await runProcess({
        command: runner.command,
        args: runner.runArgs ? runner.runArgs(sourceFile) : ['run', sourceFile],
        cwd: tempDir,
        stdin: input,
        timeoutMs
      });

      return {
        success: run.exitCode === 0 && !run.timedOut,
        phase: 'run',
        stdout: run.stdout,
        stderr: run.timedOut ? 'Execution timed out.' : run.stderr,
        errors: parseCompilerMessages(run.stderr),
        exitCode: run.exitCode,
        timedOut: run.timedOut
      };
    }

    if (language === 'Rust') {
      const compileCandidate = pickCommand(getRustCompileCandidates());
      if (!compileCandidate) {
        return resolveToolchainOrCloud({
          language,
          code,
          input,
          timeoutMs,
          phase: 'compile',
          message: 'Rust compiler not found on server (rustc).'
        });
      }

      const sourceFile = path.join(tempDir, 'main.rs');
      const outFile = getBinaryPath(tempDir, 'main_rust');
      await fs.writeFile(sourceFile, code, 'utf8');

      const compile = await runProcess({
        command: compileCandidate.command,
        args: [sourceFile, '-O', '-o', outFile],
        cwd: tempDir,
        timeoutMs
      });

      if (compile.exitCode !== 0 || compile.timedOut) {
        const errors = parseCompilerMessages(compile.stderr);
        return {
          success: false,
          phase: 'compile',
          stdout: compile.stdout,
          stderr: compile.timedOut ? 'Compilation timed out.' : compile.stderr,
          errors: errors.length ? errors : [compile.timedOut ? 'Compilation timed out.' : 'Compilation failed.'],
          exitCode: compile.exitCode,
          timedOut: compile.timedOut
        };
      }

      const run = await runProcess({
        command: outFile,
        args: [],
        cwd: tempDir,
        stdin: input,
        timeoutMs
      });

      return {
        success: run.exitCode === 0 && !run.timedOut,
        phase: 'run',
        stdout: run.stdout,
        stderr: run.timedOut ? 'Execution timed out.' : run.stderr,
        errors: parseCompilerMessages(run.stderr),
        exitCode: run.exitCode,
        timedOut: run.timedOut
      };
    }

    if (language === 'Kotlin') {
      const kotlinCandidates = getKotlinCandidates();
      const compileCandidate = pickCommand(kotlinCandidates.compile);
      const runCandidate = pickCommand(kotlinCandidates.run);
      if (!compileCandidate || !runCandidate) {
        return resolveToolchainOrCloud({
          language,
          code,
          input,
          timeoutMs,
          phase: 'compile',
          message: 'Kotlin toolchain not found on server (kotlinc + java).'
        });
      }

      const sourceFile = path.join(tempDir, getKotlinMainFileName(code));
      const jarFile = path.join(tempDir, 'main-kotlin.jar');
      await fs.writeFile(sourceFile, code, 'utf8');

      const compile = await runProcess({
        command: compileCandidate.command,
        args: compileCandidate.runArgs
          ? compileCandidate.runArgs([sourceFile, '-include-runtime', '-d', jarFile])
          : [sourceFile, '-include-runtime', '-d', jarFile],
        cwd: tempDir,
        timeoutMs
      });

      if (compile.exitCode !== 0 || compile.timedOut) {
        const errors = parseCompilerMessages(compile.stderr || compile.stdout);
        return {
          success: false,
          phase: 'compile',
          stdout: compile.stdout,
          stderr: compile.timedOut ? 'Compilation timed out.' : (compile.stderr || compile.stdout),
          errors: errors.length ? errors : [compile.timedOut ? 'Compilation timed out.' : 'Compilation failed.'],
          exitCode: compile.exitCode,
          timedOut: compile.timedOut
        };
      }

      const run = await runProcess({
        command: runCandidate.command,
        args: ['-jar', jarFile],
        cwd: tempDir,
        stdin: input,
        timeoutMs
      });

      return {
        success: run.exitCode === 0 && !run.timedOut,
        phase: 'run',
        stdout: run.stdout,
        stderr: run.timedOut ? 'Execution timed out.' : run.stderr,
        errors: parseCompilerMessages(run.stderr),
        exitCode: run.exitCode,
        timedOut: run.timedOut
      };
    }

    return missingToolchainResult('validation', `Language not implemented: ${language}`);
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
};

module.exports = {
  executeCode,
  SUPPORTED_LANGUAGES,
  getAvailableToolchains
};
