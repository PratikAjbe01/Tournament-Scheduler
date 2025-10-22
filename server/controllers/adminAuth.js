
import Admin from "../models/admin.js";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
const register=async(req,res)=>{
try {
    const {name,email,password}=req.body;
    if(!name || !email || !password){
        return res.status(400).json({message:"All fields are required"})
    }
    const user=await Admin.findOne({email});
    if(user){
        return res.status(400).json({message:"User already exists"})
    }   
    const newPass=await bcrypt.hash(password,10);
    await Admin.create({name,email,password:newPass});
    return res.status(201).json({message:"User registered successfully"});
} catch (error) {
    console.log(error);
}
}
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1️⃣ Validate input
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // 2️⃣ Check if user exists
    const user = await Admin.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User does not exist" });
    }

    // 3️⃣ Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // 4️⃣ Generate JWT
    const token = jwt.sign(
      { id: user._id }, // 🔹 keep key consistent with your middleware
      process.env.JWT_SECRET,
      { expiresIn: "3d" }
    );

    // 5️⃣ Set cookie + send response
    res
      .cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      })
      .status(200)
      .json({ message: "User logged in successfully" ,user:user});

  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
const logout=async(_,res)=>{
    try {
        return res.status(200).cookie("token","",{maxAge:0}).json({message:"User logged out successfully"})
    } catch (error) {
        console.log(error);
    }
}
export const getProfile = async (req, res) => {
  try {
   
    const adminId = req.user?._id;

    const admin = await Admin.findById(adminId).select("-password");

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.status(200).json({
      success: true,
      data: admin,
    })
  } catch (error) {
    console.error("Error fetching admin profile:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching profile",
    });
  }
};

export {register,login,logout}