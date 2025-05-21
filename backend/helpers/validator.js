const { body, validationResult } = require('express-validator');

const registerValidation = [
  body('email')
    .isEmail().withMessage('Proszę podać poprawny adres email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 }).withMessage('Hasło musi zawierać minimum 6 znaków'),
  body('nick')
    .trim()
    .isLength({ min: 3 }).withMessage('Nick musi zawierać minimum 3 znaki')
];

const loginValidation = [
  body('email')
    .isEmail().withMessage('Proszę podać poprawny adres email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Proszę podać hasło')
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

module.exports = {
  registerValidation,
  loginValidation,
  validate
};
