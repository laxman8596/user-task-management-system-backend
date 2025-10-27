import User from "../models/user.js"
import bcrypt from "bcryptjs";
import Jwt from "jsonwebtoken";

export const register = async(req,res)=>{

    const {username, email, password, role}=req.body;
    
    if( !username|| !email || !password) {
        return res.status(400).json({message:"All fields are required"});
    }



    try{
        const existingUser = await User.findOne({email});
    
        if(existingUser){
            return res.status(400).json({message:"User already exists"});
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            username,
            email,
            password: hashedPassword,
            role: role || 'user'
        });
        await user.save();
        res.status(201).json({
            message:'User registered successfully',
            user:{
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        })
    }
    catch(error){
    console.error("error registering user:",error);
    return res.status(500).json({message:"Database connection error", error: error.message});
}
}

export const login = async(req, res)=>{
    const {email, password}=req.body;

    if( !email || !password) {
        return res.status(400).json({message:"All fields are required"});
    }

    try{
        const user = await User.findOne({email});

        if(!user){
            return res.status(401).json({message:"User does not exist"});
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if(!isMatch){
            return res.status(401).json({message:"Invalid credentials"});
        }

        const accessToken = Jwt.sign(
            {
                id: user._id,
            role: user.role
            },
            process.env.ACCESS_TOKEN_SECRET,
            {expiresIn: "7d"}
        )

        const refreshToken = Jwt.sign(
            {
                id: user._id,
            role: user.role
            },
            process.env.REFRESH_TOKEN_SECRET,
            {expiresIn: "7d"}
        )
res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
});
res.status(200).json({
      accessToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });

        // return res.status(200).json({message:"Login successful", user});
    }
    catch(error){
        console.error("error logging in user:", error);
        return res.status(500).json({message:"server error"});
    }
}

export const refreshToken = async(req,res)=>{
    const token = req.cookies.refreshToken;
    if(!token){
        return res.status(401).json({message:"No refresh token provided"});
    }
    try{
        const decoded = Jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decoded.id);
        if(!user){
            return res.status(404).json({message:"User not found"});
        }
        const newAccessToken = Jwt.sign(
            {
                id: user._id,
                role: user.role
            },
            process.env.ACCESS_TOKEN_SECRET,
            {expiresIn: "7d"}
        );
        res.status(200).json({
            accessToken: newAccessToken,
            user:{
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        })
    } catch(error){
        console.error("error refreshing token:", error);
        return res.status(401).json({message:"Invalid refresh token"});
    }
}
export const logout = async (req, res) => {
  try {
    const user = req.user || null;

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Logout successful",
      user, // will be null if no user attached
    });
  } catch (error) {
    console.error("Error logging out user:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
