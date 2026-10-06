// ============================================================
// GHAR - REAL ESTATE PLATFORM
// app.js
// Main Frontend Application Bootstrap / Orchestrator
// ============================================================
"use strict";
(function (window, document) {
  // ==========================================================
  // GHAR NAMESPACE
  // ==========================================================
  const GHAR =
    window.GHAR =
    window.GHAR || {};
  // ==========================================================
  // APPLICATION
  // ==========================================================
  const App = {
    // --------------------------------------------------------
    // CORE
    // --------------------------------------------------------
    version: "2.0.0",
    initialized: false,
    initializing: false,
    ready: false,
    destroyed: false,
    startedAt: null,
    config:
      window.GHAR_CONFIG ||
      window.GHARConfig ||
      {},
    state: {
      page: null,
      module: null,
      user: null,
      role: "guest",
      authenticated: false,
      online:
        typeof navigator !== "undefined"
          ? navigator.onLine
          : true,
      apiReady: false,
      dependenciesReady: false
    },
    // ========================================================
    // INITIALIZATION
    // ========================================================
    async init() {
      if (this.ready) {
        return this;
      }
      if (this.initializing) {
        return this;
      }
      this.initializing = true;
      this.destroyed = false;
      this.startedAt = Date.now();
      try {
        // ----------------------------------------------------
        // 1. Detect environment
        // ----------------------------------------------------
        this.initEnvironment();
        // ----------------------------------------------------
        // 2. Register lifecycle listeners
        // ----------------------------------------------------
        this.bindLifecycleEvents();
        // ----------------------------------------------------
        // 3. Initialize utilities
        // ----------------------------------------------------
        this.initUtilities();
        // ----------------------------------------------------
        // 4. Initialize identity
        // ----------------------------------------------------
        this.initIdentity();
        // ----------------------------------------------------
        // 5. Initialize accessibility
        // ----------------------------------------------------
        this.initAccessibility();
        // ----------------------------------------------------
        // 6. Initialize network state
        // ----------------------------------------------------
        this.initNetwork();
        // ----------------------------------------------------
        // 7. Initialize API integration
        // ----------------------------------------------------
        this.initAPI();
        // ----------------------------------------------------
        // 8. Initialize global components
        // ----------------------------------------------------
        this.initComponents();
        // ----------------------------------------------------
        // 9. Initialize navigation
        // ----------------------------------------------------
        this.initNavigation();
        // ----------------------------------------------------
        // 10. Detect current page
        // ----------------------------------------------------
        this.initPage();
        // ----------------------------------------------------
        // 11. Initialize page module
        // ----------------------------------------------------
        await this.initPageModule();
        // ----------------------------------------------------
        // 12. Apply application state
        // ----------------------------------------------------
        this.applyDOMState();
        // ----------------------------------------------------
        // 13. Mark application ready
        // ----------------------------------------------------
        this.initialized = true;
        this.ready = true;
        this.initializing = false;
        document.documentElement.classList.add(
          "ghar-app-ready"
        );
        document.documentElement.dataset.gharVersion =
          this.version;
        this.emit(
          "ready",
          {
            app: this,
            version: this.version,
            page: this.state.page,
            module: this.state.module,
            role: this.state.role,
            authenticated:
              this.state.authenticated
          }
        );
        return this;
      } catch (error) {
        this.initialized = false;
        this.ready = false;
        this.initializing = false;
        this.handleInitializationError(error);
        throw error;
      }
    },
    // ========================================================
    // ENVIRONMENT
    // ========================================================
    initEnvironment() {
      this.state.online =
        typeof navigator === "undefined"
          ? true
          : navigator.onLine;
      document.documentElement.dataset.gharEnvironment =
        this.getEnvironment();
    },
    getEnvironment() {
      if (
        this.config.environment
      ) {
        return String(
          this.config.environment
        ).toLowerCase();
      }
      if (
        window.location.hostname ===
        "localhost" ||
        window.location.hostname ===
        "127.0.0.1"
      ) {
        return "development";
      }
      return "production";
    },
    isDevelopment() {
      return (
        this.getEnvironment() ===
        "development"
      );
    },
    // ========================================================
    // IDENTITY
    // ========================================================
    initIdentity() {
      let user = null;
      try {
        if (
          GHAR.Auth &&
          typeof GHAR.Auth.getUser ===
          "function"
        ) {
          user =
            GHAR.Auth.getUser();
        }
      } catch (error) {
        this.warn(
          "Unable to load authenticated user.",
          error
        );
      }
      this.state.user =
        user || null;
      this.state.authenticated =
        this.resolveAuthentication(
          user
        );
      // ------------------------------------------------------
      // Role
      // ------------------------------------------------------
      if (
        GHAR.Role
      ) {
        try {
          if (
            typeof GHAR.Role.setFromUser ===
            "function"
          ) {
            GHAR.Role.setFromUser(
              user
            );
          }
          if (
            typeof GHAR.Role.get ===
            "function"
          ) {
            this.state.role =
              GHAR.Role.get() ||
              "guest";
          }
        } catch (error) {
          this.warn(
            "Unable to initialize role.",
            error
          );
        }
      }
      // ------------------------------------------------------
      // Permission
      // ------------------------------------------------------
      if (
        GHAR.Permissions
      ) {
        try {
          if (
            typeof GHAR.Permissions.setUser ===
            "function"
          ) {
            GHAR.Permissions.setUser(
              user
            );
          }
        } catch (error) {
          this.warn(
            "Unable to initialize permissions.",
            error
          );
        }
      }
    },
    resolveAuthentication(user) {
      try {
        if (
          GHAR.Auth &&
          typeof GHAR.Auth.isAuthenticated ===
          "function"
        ) {
          return Boolean(
            GHAR.Auth.isAuthenticated()
          );
        }
      } catch (error) {
        this.warn(
          "Authentication status could not be resolved.",
          error
        );
      }
      return Boolean(user);
    },
    // ========================================================
    // UTILITIES
    // ========================================================
    initUtilities() {
      // ------------------------------------------------------
      // Accessibility
      // ------------------------------------------------------
      if (
        GHAR.Accessibility &&
        typeof GHAR.Accessibility.init ===
        "function"
      ) {
        GHAR.Accessibility.init();
      }
      // ------------------------------------------------------
      // Error handler
      // ------------------------------------------------------
      if (
        GHAR.ErrorHandler &&
        typeof GHAR.ErrorHandler.init ===
        "function"
      ) {
        GHAR.ErrorHandler.init();
      }
      // ------------------------------------------------------
      // Offline manager
      // ------------------------------------------------------
      if (
        GHAR.Offline &&
        typeof GHAR.Offline.init ===
        "function"
      ) {
        GHAR.Offline.init();
      }
    },
    // ========================================================
    // ACCESSIBILITY
    // ========================================================
    initAccessibility() {
      if (
        !GHAR.Accessibility
      ) {
        return;
      }
      try {
        if (
          typeof GHAR.Accessibility
            .setupAccessibleImages ===
          "function"
        ) {
          GHAR.Accessibility
            .setupAccessibleImages();
        }
        if (
          typeof GHAR.Accessibility
            .setupSkipLinks ===
          "function"
        ) {
          GHAR.Accessibility
            .setupSkipLinks();
        }
      } catch (error) {
        this.warn(
          "Accessibility initialization failed.",
          error
        );
      }
    },
    // ========================================================
    // NETWORK
    // ========================================================
    initNetwork() {
      this.updateNetworkState();
      if (
        GHAR.Offline &&
        typeof GHAR.Offline.updateDOM ===
        "function"
      ) {
        try {
          GHAR.Offline.updateDOM();
        } catch (error) {
          this.warn(
            "Unable to update offline state.",
            error
          );
        }
      }
    },
    updateNetworkState() {
      this.state.online =
        typeof navigator === "undefined"
          ? true
          : navigator.onLine;
      document.documentElement
        .classList.toggle(
          "ghar-online",
          this.state.online
        );
      document.documentElement
        .classList.toggle(
          "ghar-offline",
          !this.state.online
        );
      document.documentElement.dataset.gharNetwork =
        this.state.online
          ? "online"
          : "offline";
      this.emit(
        "network",
        {
          online:
            this.state.online
        }
      );
    },
    // ========================================================
    // API
    // ========================================================
    initAPI() {
      if (
        window.GHARApi
      ) {
        this.state.apiReady =
          true;
        this.state.dependenciesReady =
          true;
        this.emit(
          "api:ready",
          {
            api:
              window.GHARApi
          }
        );
        return;
      }
      this.state.apiReady =
        false;
      this.warn(
        "GHARApi is not available at application bootstrap."
      );
    },
    // ========================================================
    // COMPONENTS
    // ========================================================
    initComponents() {
      if (
        GHAR.Components &&
        typeof GHAR.Components.init ===
        "function"
      ) {
        try {
          GHAR.Components.init();
        } catch (error) {
          this.handleModuleError(
            "components",
            error
          );
        }
      }
      if (
        GHAR.Toast &&
        typeof GHAR.Toast.init ===
        "function"
      ) {
        try {
          GHAR.Toast.init();
        } catch (error) {
          this.handleModuleError(
            "toast",
            error
          );
        }
      }
    },
    // ========================================================
    // NAVIGATION
    // ========================================================
    initNavigation() {
      if (
        !GHAR.Navigation ||
        typeof GHAR.Navigation.init !==
        "function"
      ) {
        return;
      }
      try {
        GHAR.Navigation.init();
      } catch (error) {
        this.handleModuleError(
          "navigation",
          error
        );
      }
    },
    // ========================================================
    // PAGE
    // ========================================================
    initPage() {
      const body =
        document.body;
      const page =
        body?.dataset.page ||
        body?.dataset.module ||
        null;
      const module =
        body?.dataset.module ||
        page ||
        null;
      this.state.page =
        page;
      this.state.module =
        module;
      document.documentElement.dataset.gharPage =
        page || "";
      document.documentElement.dataset.gharModule =
        module || "";
      this.emit(
        "page:init",
        {
          page,
          module
        }
      );
    },
    getPage() {
      return (
        this.state.page ||
        document.body?.dataset.page ||
        document.body?.dataset.module ||
        null
      );
    },
    getModule() {
      return (
        this.state.module ||
        document.body?.dataset.module ||
        this.getPage()
      );
    },
    // ========================================================
    // PAGE MODULE INITIALIZATION
    // ========================================================
    async initPageModule() {
      const page =
        this.getPage();
      const module =
        this.getModule();
      if (!page && !module) {
        return;
      }
      this.emit(
        "page:before-init",
        {
          page,
          module
        }
      );
      // ------------------------------------------------------
      // Existing GHAR page registry
      // ------------------------------------------------------
      if (
        GHAR.Pages &&
        typeof GHAR.Pages.init ===
        "function"
      ) {
        try {
          await GHAR.Pages.init(
            page,
            {
              app: this,
              module,
              user:
                this.state.user,
              role:
                this.state.role
            }
          );
        } catch (error) {
          this.handleModuleError(
            `page:${page || module}`,
            error
          );
        }
      }
      // ------------------------------------------------------
      // Page-specific initialization event
      // ------------------------------------------------------
      this.emit(
        "page:ready",
        {
          page,
          module,
          role:
            this.state.role
        }
      );
    },
    // ========================================================
    // DOM STATE
    // ========================================================
    applyDOMState() {
      const html =
        document.documentElement;
      html.dataset.gharAuth =
        this.state.authenticated
          ? "authenticated"
          : "guest";
      html.dataset.gharRole =
        this.state.role ||
        "guest";
      html.classList.toggle(
        "ghar-authenticated",
        this.state.authenticated
      );
      html.classList.toggle(
        "ghar-guest",
        !this.state.authenticated
      );
      // ------------------------------------------------------
      // Role class
      // ------------------------------------------------------
      const roleClass =
        this.normalizeRoleClass(
          this.state.role
        );
      if (roleClass) {
        html.classList.add(
          `ghar-role-${roleClass}`
        );
      }
    },
    normalizeRoleClass(role) {
      return String(
        role || "guest"
      )
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, "-");
    },
    // ========================================================
    // AUTHENTICATION
    // ========================================================
    isAuthenticated() {
      return Boolean(
        this.state.authenticated
      );
    },
    getUser() {
      if (
        GHAR.Auth &&
        typeof GHAR.Auth.getUser ===
        "function"
      ) {
        try {
          return GHAR.Auth.getUser();
        } catch (error) {
          this.warn(
            "Unable to retrieve current user.",
            error
          );
        }
      }
      return this.state.user;
    },
    getRole() {
      if (
        GHAR.Role &&
        typeof GHAR.Role.get ===
        "function"
      ) {
        try {
          return GHAR.Role.get() ||
            this.state.role ||
            "guest";
        } catch (error) {
          this.warn(
            "Unable to retrieve current role.",
            error
          );
        }
      }
      return (
        this.state.role ||
        "guest"
      );
    },
    // ========================================================
    // ROLE CHECKING
    // ========================================================
    hasRole(role) {
      if (!role) {
        return false;
      }
      const current =
        String(
          this.getRole()
        ).toLowerCase();
      if (
        Array.isArray(role)
      ) {
        return role.some(
          item =>
            String(item)
              .toLowerCase() ===
            current
        );
      }
      return (
        current ===
        String(role)
          .toLowerCase()
      );
    },
    hasAnyRole(roles = []) {
      return this.hasRole(
        roles
      );
    },
    // ========================================================
    // PERMISSIONS
    // ========================================================
    can(permission) {
      if (
        !permission
      ) {
        return false;
      }
      if (
        GHAR.Permissions &&
        typeof GHAR.Permissions.can ===
        "function"
      ) {
        try {
          return Boolean(
            GHAR.Permissions.can(
              permission
            )
          );
        } catch (error) {
          this.warn(
            "Permission check failed.",
            error
          );
        }
      }
      return false;
    },
    // ========================================================
    // GUARDS
    // ========================================================
    requireAuth(options = {}) {
      if (
        this.isAuthenticated()
      ) {
        return true;
      }
      const redirect =
        options.redirect ||
        "/login.html";
      this.emit(
        "auth:required",
        {
          redirect
        }
      );
      if (
        options.redirect !== false
      ) {
        this.navigate(
          redirect
        );
      }
      return false;
    },
    requireRole(
      roles,
      options = {}
    ) {
      if (
        !this.requireAuth(
          {
            redirect:
              options.loginRedirect
          }
        )
      ) {
        return false;
      }
      if (
        this.hasRole(
          roles
        )
      ) {
        return true;
      }
      const redirect =
        options.redirect ||
        "/403.html";
      this.emit(
        "access:denied",
        {
          roles,
          currentRole:
            this.getRole(),
          redirect
        }
      );
      if (
        options.redirect !== false
      ) {
        this.navigate(
          redirect
        );
      }
      return false;
    },
    requirePermission(
      permission,
      options = {}
    ) {
      if (
        !this.requireAuth(
          {
            redirect:
              options.loginRedirect
          }
        )
      ) {
        return false;
      }
      if (
        this.can(
          permission
        )
      ) {
        return true;
      }
      const redirect =
        options.redirect ||
        "/403.html";
      this.emit(
        "permission:denied",
        {
          permission,
          role:
            this.getRole(),
          redirect
        }
      );
      if (
        options.redirect !== false
      ) {
        this.navigate(
          redirect
        );
      }
      return false;
    },
    // ========================================================
    // NAVIGATION
    // ========================================================
    navigate(path, options = {}) {
      if (!path) {
        return false;
      }
      if (
        GHAR.Navigation &&
        typeof GHAR.Navigation.navigate ===
        "function"
      ) {
        return GHAR.Navigation.navigate(
          path,
          options
        );
      }
      if (
        options.replace
      ) {
        window.location.replace(
          path
        );
      } else {
        window.location.href =
          path;
      }
      return true;
    },
    back() {
      if (
        window.history &&
        window.history.length > 1
      ) {
        window.history.back();
        return true;
      }
      return false;
    },
    // ========================================================
    // LOGOUT
    // ========================================================
    async logout(options = {}) {
      try {
        if (
          GHAR.Auth &&
          typeof GHAR.Auth.logout ===
          "function"
        ) {
          await GHAR.Auth.logout();
        }
      } catch (error) {
        this.handleModuleError(
          "logout",
          error
        );
      } finally {
        this.state.user =
          null;
        this.state.role =
          "guest";
        this.state.authenticated =
          false;
        this.applyDOMState();
        this.emit(
          "auth:logout",
          {
            reason:
              options.reason ||
              "user"
          }
        );
        if (
          options.redirect !== false
        ) {
          this.navigate(
            options.redirect ||
            "/login.html"
          );
        }
      }
    },
    // ========================================================
    // REFRESH IDENTITY
    // ========================================================
    refreshIdentity() {
      this.initIdentity();
      this.applyDOMState();
      this.emit(
        "identity:updated",
        {
          user:
            this.state.user,
          role:
            this.state.role,
          authenticated:
            this.state.authenticated
        }
      );
      return {
        user:
          this.state.user,
        role:
          this.state.role,
        authenticated:
          this.state.authenticated
      };
    },
    // ========================================================
    // EVENT SYSTEM
    // ========================================================
    emit(name, detail = {}) {
      document.dispatchEvent(
        new CustomEvent(
          `ghar:${name}`,
          {
            detail
          }
        )
      );
    },
    // ========================================================
    // LIFECYCLE EVENTS
    // ========================================================
    bindLifecycleEvents() {
      window.addEventListener(
        "online",
        this._handleOnline
      );
      window.addEventListener(
        "offline",
        this._handleOffline
      );
      window.addEventListener(
        "beforeunload",
        this._handleBeforeUnload
      );
      window.addEventListener(
        "ghar:api-ready",
        this._handleApiReady
      );
    },
    unbindLifecycleEvents() {
      window.removeEventListener(
        "online",
        this._handleOnline
      );
      window.removeEventListener(
        "offline",
        this._handleOffline
      );
      window.removeEventListener(
        "beforeunload",
        this._handleBeforeUnload
      );
      window.removeEventListener(
        "ghar:api-ready",
        this._handleApiReady
      );
    },
    _handleOnline() {
      App.updateNetworkState();
    },
    _handleOffline() {
      App.updateNetworkState();
    },
    _handleApiReady() {
      App.state.apiReady =
        true;
      App.state.dependenciesReady =
        true;
      App.emit(
        "api:ready",
        {
          api:
            window.GHARApi
        }
      );
    },
    _handleBeforeUnload() {
      App.emit(
        "beforeunload",
        {
          app:
            App
        }
      );
    },
    // ========================================================
    // ERROR HANDLING
    // ========================================================
    handleInitializationError(
      error
    ) {
      document.documentElement
        .classList.add(
          "ghar-app-error"
        );
      this.emit(
        "error",
        {
          source:
            "app-init",
          error
        }
      );
      if (
        GHAR.ErrorHandler &&
        typeof GHAR.ErrorHandler.handle ===
        "function"
      ) {
        try {
          GHAR.ErrorHandler.handle(
            error,
            {
              source:
                "app-init",
              userMessage:
                "GHAR could not initialize correctly."
            }
          );
          return;
        } catch (handlerError) {
          console.error(
            "GHAR error handler failed:",
            handlerError
          );
        }
      }
      console.error(
        "GHAR initialization error:",
        error
      );
    },
    handleModuleError(
      moduleName,
      error
    ) {
      this.emit(
        "module:error",
        {
          module:
            moduleName,
          error
        }
      );
      if (
        this.isDevelopment()
      ) {
        console.error(
          `GHAR module error [${moduleName}]:`,
          error
        );
      }
    },
    warn(message, error) {
      if (
        this.isDevelopment()
      ) {
        if (error) {
          console.warn(
            `GHAR: ${message}`,
            error
          );
        } else {
          console.warn(
            `GHAR: ${message}`
          );
        }
      }
    },
    // ========================================================
    // STATUS
    // ========================================================
    getState() {
      return {
        version:
          this.version,
        initialized:
          this.initialized,
        ready:
          this.ready,
        initializing:
          this.initializing,
        page:
          this.getPage(),
        module:
          this.getModule(),
        user:
          this.getUser(),
        role:
          this.getRole(),
        authenticated:
          this.isAuthenticated(),
        online:
          this.state.online,
        apiReady:
          this.state.apiReady,
        dependenciesReady:
          this.state.dependenciesReady,
        environment:
          this.getEnvironment()
      };
    },
    // ========================================================
    // DESTROY
    // ========================================================
    destroy() {
      if (
        this.destroyed
      ) {
        return;
      }
      this.unbindLifecycleEvents();
      this.emit(
        "destroy",
        {
          app:
            this
        }
      );
      document.documentElement
        .classList.remove(
          "ghar-app-ready"
        );
      this.initialized =
        false;
      this.ready =
        false;
      this.destroyed =
        true;
    }
  };
  // ==========================================================
  // PUBLIC NAMESPACE
  // ==========================================================
  GHAR.App =
    App;
  window.GHARApp =
    App;
  // ==========================================================
  // BACKWARD COMPATIBILITY
  // ==========================================================
  GHAR.getUser =
    () => App.getUser();
  GHAR.getRole =
    () => App.getRole();
  GHAR.isAuthenticated =
    () => App.isAuthenticated();
  GHAR.navigate =
    (path, options) =>
      App.navigate(path, options);
  // ==========================================================
  // DOM READY
  // ==========================================================
  function bootstrap() {
    App.init()
      .catch(error => {
        if (
          App.isDevelopment()
        ) {
          console.error(
            "GHAR bootstrap failed:",
            error
          );
        }
      });
  }
  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      bootstrap,
      {
        once: true
      }
    );
  } else {
    bootstrap();
  }
})(window, document);

Important upgrade

This version makes app.js responsible for the application lifecycle, not individual business features.

The intended dependency chain is:

config.js
   ↓
storage.js
   ↓
auth.js
   ↓
role.js
   ↓
permissions.js
   ↓
api.js
   ↓
components.js
   ↓
navigation.js
   ↓
app.js
   ↓
page-specific modules

For your GHAR project, that means:

* api.js → communicates with your Express backend.
* auth.js → authentication/session.
* role.js → identifies Buyer/Seller/Admin/etc.
* permissions.js → controls what each role can do.
* app.js → starts everything and coordinates it.
* compare.js → comparison feature.
* property.js → property feature.
* payment.js → payment feature.
* loan.js → loan feature.
* admin.js → administration feature.

One particularly useful addition is the guard API:

GHAR.App.requireAuth();
GHAR.App.requireRole("seller");
GHAR.App.requireRole([
  "seller",
  "agent",
  "developer"
]);
GHAR.App.requirePermission(
  "property:create"
);

And you can inspect the complete application state with:

GHAR.App.getState();

For example:

{
  version: "2.0.0",
  initialized: true,
  ready: true,
  page: "seller-dashboard",
  module: "seller",
  role: "seller",
  authenticated: true,
  online: true,
  apiReady: true,
  dependenciesReady: true,
  environment: "production"
}

One thing to fix in your project before using the guards: your role.js and permissions.js should expose setFromUser(), get(), setUser(), and can() respectively. Otherwise app.js will safely fall back, but role/permission enforcement will not be complete.