import express from "express";
import { rateLimit } from "express-rate-limit";
import {
  getCompanies,
  getCompanyById,
  getCompanyJobListing,
  getCompanyProfile,
  register,
  signIn,
  updateCompanyProfile,
} from "../controllers/companyController.js";
import userAuth from "../middleware/authMiddleware.js";

const router = express.Router();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, //15 minutes
  max: 100, // Limit each IP to 100 requests per `window`
  standardHeaders: true,
  legacyHeaders: false,
});

//Auth
router.post("/register", limiter, register);
router.post("/login", limiter, signIn);

//Get data
router.get("/get-company-profile", userAuth, getCompanyProfile);
router.get("/get-company-listing", userAuth, getCompanyJobListing);
router.get("/", getCompanies);
router.get("/get-company/:id", getCompanyById);

//Update data
router.put("/update-company", userAuth, updateCompanyProfile);

export default router;
