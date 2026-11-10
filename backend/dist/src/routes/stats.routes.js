"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const codeforces_controller_1 = require("../controllers/codeforces.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const leetcode_controller_1 = require("../controllers/leetcode.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.protect);
router.get("/codeforces", codeforces_controller_1.fetchCodeForcesStats);
router.get("/leetcode", leetcode_controller_1.fetchLeetcodeStats);
exports.default = router;
//# sourceMappingURL=stats.routes.js.map