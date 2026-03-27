const safeString = (value) => (value ? String(value) : null);

const logAdminAudit = async (req, {
  action,
  targetType,
  targetId,
  status = 'SUCCESS',
  metadata = null
}) => {
  const entry = {
    timestamp: new Date().toISOString(),
    adminId: safeString(req?.user?._id),
    adminEmail: safeString(req?.user?.email),
    action: safeString(action),
    targetType: safeString(targetType),
    targetId: safeString(targetId),
    status: safeString(status),
    ip: safeString(req?.ip),
    userAgent: safeString(req?.headers?.['user-agent']),
    metadata
  };

  console.info('[admin-audit]', JSON.stringify(entry));
};

module.exports = {
  logAdminAudit
};
