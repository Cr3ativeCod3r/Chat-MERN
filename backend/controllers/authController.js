const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

const registerUser = async (req, res) => {
  const { email, password, nick } = req.body;

  try {
    const userExists = await User.findOne({ $or: [{ email }, { nick }] });

    if (userExists) {
      if (userExists.email === email) {
        return res.status(400).json({ message: 'Użytkownik z tym emailem już istnieje' });
      } else {
        return res.status(400).json({ message: 'Użytkownik z tym nickiem już istnieje' });
      }
    }

    const user = await User.create({
      email,
      password,
      nick
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        email: user.email,
        nick: user.nick,
        token: generateToken(user._id)
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Wystąpił błąd serwera', error: error.message });
  }
};


const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Nieprawidłowy email lub hasło' });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Nieprawidłowy email lub hasło' });
    }

    res.status(200).json({
      _id: user._id,
      email: user.email,
      nick: user.nick,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: 'Wystąpił błąd serwera', error: error.message });
  }
};


const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'Użytkownik nie znaleziony' });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Wystąpił błąd serwera', error: error.message });
  }
};

const updateUserNick = async (req, res) => {
  const { nick: newNick } = req.body;

  if (!newNick || newNick.trim() === "") {
    return res.status(400).json({ message: 'Nick nie może być pusty.' });
  }

  try {
    const nickExists = await User.findOne({ nick: newNick, _id: { $ne: req.user._id } });
    if (nickExists) {
      return res.status(400).json({ message: 'Ten nick jest już zajęty przez innego użytkownika.' });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'Użytkownik nie znaleziony' });
    }

    user.nick = newNick;
    const updatedUser = await user.save();

    res.status(200).json({
      _id: updatedUser._id,
      email: updatedUser.email,
      nick: updatedUser.nick,
    });

  } catch (error) {
    res.status(500).json({ message: 'Wystąpił błąd serwera podczas aktualizacji nicku', error: error.message });
  }
};


const deleteUserAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'Użytkownik nie znaleziony' });
    }
    await User.findByIdAndDelete(req.user._id);
    res.status(200).json({ message: 'Konto użytkownika zostało pomyślnie usunięte.' });

  } catch (error) {
    res.status(500).json({ message: 'Wystąpił błąd serwera podczas usuwania konta', error: error.message });
  }
};


module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserNick,
  deleteUserAccount
};