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
    .min(4, "Password must be at least 4 characters")
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
