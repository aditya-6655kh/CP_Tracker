import { AuthRequest } from "../middlewares/auth.middleware";
import { Response } from "express";
export declare const getMe: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const router: import("express-serve-static-core").Router;
export default router;
//# sourceMappingURL=auth.routes.d.ts.map