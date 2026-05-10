"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initAdminClaim = exports.markArtistPaid = exports.ecwidWebhook = void 0;
const admin = require("firebase-admin");
admin.initializeApp();
var ecwidWebhook_1 = require("./ecwidWebhook");
Object.defineProperty(exports, "ecwidWebhook", { enumerable: true, get: function () { return ecwidWebhook_1.ecwidWebhook; } });
var markArtistPaid_1 = require("./markArtistPaid");
Object.defineProperty(exports, "markArtistPaid", { enumerable: true, get: function () { return markArtistPaid_1.markArtistPaid; } });
var initAdminClaim_1 = require("./initAdminClaim");
Object.defineProperty(exports, "initAdminClaim", { enumerable: true, get: function () { return initAdminClaim_1.initAdminClaim; } });
//# sourceMappingURL=index.js.map