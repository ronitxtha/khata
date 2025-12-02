import * as yup from "yup";  // corrected import

export const userSchema = yup.object({
  username: yup
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .required(),
  email: yup.string().email("Invalid email format").required(),
 password: yup
  .string()
  .min(8, "Password must be at least 8 characters")
  .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
  .matches(/[0-9]/, "Password must contain at least one number")
  .matches(/[@$!%*?&]/, "Password must contain at least one special character (@, $, !, %, *, ?, &)")
  .required(),

  role: yup
    .string()
    .oneOf(["customer", "owner"], "Role must be either 'customer' or 'owner'")
    .required("Role is required")
});

export const validateUser = (schema) => async (req, res, next) => {
    try {
        await schema.validate(req.body, { abortEarly: false });
        next();
    } catch (err) {
        return res.status(400).json({ errors: err.errors });
    }
};
