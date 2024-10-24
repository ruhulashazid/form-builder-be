import { v2 as cloudinary } from "cloudinary";

const SECRET = "Y2_CUrRuio-4ahjpw9MJWT7_KmI";
const API_KEY = "662578652398784";
const CLOUD_NAME = "dktsp3ss5";

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: API_KEY,
  api_secret: SECRET,
});

export default cloudinary;
