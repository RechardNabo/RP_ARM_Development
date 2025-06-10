
// Patch to prevent middleware errors in Next.js 15.2.4
const originalRequire = module.constructor.prototype.require;

module.constructor.prototype.require = function(modulePath) {
  try {
    return originalRequire.apply(this, arguments);
  } catch (error) {
    // If error is about middleware, return an empty object
    if (modulePath.includes('middleware') || modulePath.includes('_middleware')) {
      return {};
    }
    throw error;
  }
};
