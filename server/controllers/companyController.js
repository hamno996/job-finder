import mongoose from "mongoose";
import Companies from "../models/companies.js";

export const register = async (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name) {
    next("Company name is required");
    return;
  }
  if (!email) {
    next("Company email is required");
    return;
  }
  if (!password) {
    next("Company password is required");
    return;
  }

  try {
    const accountExist = await Companies.findOne({ email });
    if (accountExist) {
      next("Email already exist, Please login");
      return;
    }

    const company = await Companies.create({
      name,
      email,
      password,
    });

    await company.save();

    const token = await company.createJWT();

    res.status(200).json({
      success: true,
      message: "Company account created successfully",
      user: {
        _id: company._id,
        name: company.name,
        email: company.email,
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
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide user credentials" });
    }

    const company = await Companies.findOne({ email }).select("+password");
    if (!company) {
      return res.status(404).json({ message: "Invalid email" });
    }

    const isMatch = await company.comparePassword(password);
    if (!isMatch) {
      return res.status(404).json({ message: "Invalid password" });
    }

    company.password = undefined;
    const token = await company.createJWT();

    res.status(200).json({
      success: true,
      message: "Login successfully",
      company,
      token,
    });
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

export const updateCompanyProfile = async (req, res, next) => {
  const { name, contact, location, profileUrl, about } = req.body;

  try {
    if (!name || !location || !about || !contact || !profileUrl) {
      next("Please provide all required fields");
      return;
    }

    const id = req.body.user.userId;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).send(`No Company with id: ${id}`);
    }

    const updateCompany = {
      name,
      contact,
      location,
      profileUrl,
      about,
      _id: id,
    };

    const company = await Companies.findByIdAndUpdate(id, updateCompany, {
      new: true,
    });

    const token = await company.createJWT();

    company.password = undefined;

    res.status(200).json({
      success: true,
      message: "Company profile updated successfully",
      company,
      token,
    });
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

export const getCompanyProfile = async (req, res, next) => {
  try {
    const id = req.body.user.userId;

    const company = await Companies.findById({ _id: id });

    if (!company) {
      return res.status(404).send({
        message: "Company not found",
        success: false,
      });
    }

    company.password = undefined;
    res.status(200).json({
      success: true,
      data: company,
    });
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

export const getCompanies = async (req, res, next) => {
  try {
    const { search, sort, location } = req.query;
    // search filters
    const queryObject = {};

    if (search) {
      queryObject.name = { $regex: search, $options: "i" };
    }
    if (location) {
      queryObject.location = { $regex: location, $options: "i" };
    }

    let queryResult = Companies.find(queryObject).select("-password");

    //sort
    if (sort === "Newest") {
      queryResult = queryResult.sort("-createdAt");
    }
    if (sort === "Oldest") {
      queryResult = queryResult.sort("createdAt");
    }
    if (sort === "A-Z") {
      queryResult = queryResult.sort("name");
    }
    if (sort === "Z-A") {
      queryResult = queryResult.sort("-name");
    }

    //PADINATION
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const skip = (page - 1) * limit;

    //records count
    const total = await Companies.countDocuments(queryResult);
    const numOfPage = Math.ceil(total / limit);

    queryResult = queryResult.limit(limit * page);

    const companies = await queryResult;

    res.status(200).json({
      success: true,
      total,
      data: companies,
      page,
      numOfPage,
    });
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

export const getCompanyJobListing = async (req, res, next) => {
  const { search, sort } = req.body;
  const id = req.body.user.userId;

  try {
    const queryObject = {};

    if (search) {
      queryObject.location = { $regex: search, $options: "i" };
    }

    let sorting;
    if (sort === "Newest") {
      sorting = "-createAt";
    }
    if (sort === "Oldest") {
      sorting = "createAt";
    }
    if (sort === "A-Z") {
      sorting = "name";
    }
    if (sort === "Z-A") {
      sorting = "-name";
    }

    let queryResult = await Companies.findById({ _id: id }).populate({
      path: "jobPosts",
      options: { sort: sorting },
    });

    const companies = await queryResult;

    res.status(200).json({
      success: true,
      companies,
    });
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

export const getCompanyById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const company = await Companies.findById({ _id: id }).populate({
      path: "jobPosts",
      options: {
        sort: "_id",
      },
    });

    if (!company) {
      return res.status(404).send({
        message: "Company not found",
        success: false,
      });
    }

    company.passowrd = undefined;
    res.status(200).json({
      success: true,
      data: company,
    });
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};
