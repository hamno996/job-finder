import Users from "../models/userModels.js";

export const register = async (req, res, next) => {
  const { firstName, lastName, email, password } = req.body;

  if (!firstName) {
    next("First Name is required");
  }
  if (!lastName) {
    next("Last Name is required");
  }
  if (!email) {
    next("email required");
  }
  if (!password) {
    next("Password is required");
  }

  try {
    const userExist = await Users.findOne({ email });

    if (userExist) {
      next("Email already exist");
      return;
    }

    const user = await Users.create({
      firstName,
      lastName,
      email,
      password,
    });

    await user.save();

    const token = await user.createJWT();
    res.status(201).send({
      success: true,
      message: "Account created successfully",
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        accountType: user.accountType,
      },
      token,
    });
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

export const signIn = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    // validation
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide user credentials" });
    }

    // find user by email
    const user = await Users.findOne({ email }).select("+password");
    if (!user) {
      return res.status(400).json({ message: "Invalid email" });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    user.password = undefined;
    const token = await user.createJWT();

    res.status(200).json({
      success: true,
      message: "Login successfully",
      user,
      token,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "An error occurred" });
  }
};
