import { Router } from "express";
import {
  getAddressesCtrl,
  createAddressCtrl,
  updateAddressCtrl,
  deleteAddressCtrl,
} from "../controllers/address.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { validate, createAddressSchema, updateAddressSchema } from "../middleware/validation.middleware";

const router = Router();

router.get("/", requireAuth, getAddressesCtrl);
router.post("/", requireAuth, validate(createAddressSchema), createAddressCtrl);
router.put("/:id", requireAuth, validate(updateAddressSchema), updateAddressCtrl);
router.delete("/:id", requireAuth, deleteAddressCtrl);

export default router;
