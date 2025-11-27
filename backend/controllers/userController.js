import { verifyMail } from "../emailverify/verifyMail.js";
import { Session } from "../models/sessionModel.js";
import { User } from "../models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const registerUser = async (req, res) => {
    try {
        const {username, email, password} = req.body;
        if(!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "ALl fields are reuired"
             })
            }
             const existinguser = await User.findOne({ email })
             if(existinguser){
                return res.status(400).json({
                    success: false,
                    message: "User already exists"
                })
             }
             const hashedPassword = await bcrypt.hash(password, 10);

             const newUser = await User.create({
                username,
                email,
                password:hashedPassword
             })
            const token = jwt.sign({id:newUser.id}, process.env.SECRET_KEY,{ expiresIn:"10m"})
             verifyMail(token, email)
             newUser.token = token
             await newUser.save()


             return res.status(201).json({
                success: true,
                message: "User registered successfully",
                data:newUser
             })
            
            }catch (error) {
            return res.status(500).json({
                sucess: false,
                message: error.message
            })
         }
        
    }

    export const verification = async(req, res) => {
        try {
            const authHeader = req.headers.authorization;
            if(!authHeader || !authHeader.startsWith("Bearer ")) {
                return res.status(401).json({
                    sucess:false,
                    message:"Authorization token is missing or invalid"
                })
            }

            const token = authHeader.split(" ") [1]

            let decoded;
            try {
                decoded = jwt.verify(token, process.env.SECRET_KEY)
            } catch (err) {
                if(err.name === "TokenExpiredError") {
                    return res.status(401).json({
                        sucess:false,
                        message:"The token has expired"
            })
        }
        return res.status(401).json({
            sucess:false,
            message:"Token verification failed"
        })
    }

    const user = await User.findById(decoded.id)
    if(!user) {
        return res.status(404).json({
            sucess:false,
            message:"User not found"
        })
    }
    user.token = null
    user.isVerified = true
    await user.save()

    return res.status(200).json({
        sucess:true,
        message:"Email verified successfully"
    })
        } catch (error) {
            return res.status(500).json({
                sucess: false,
                message: error.message
            })
        }
    }

    export const loginUser = async (req, res) => {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: "All fields are required"
                });
            }
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized Access"
                });
            }
            const passwordCheck = await bcrypt.compare(password, user.password);
            if (!passwordCheck) {
                return res.status(402).json({
                    success: false,
                    message: "Incorrect Password"
                })
            }
            if (!user.isVerified) {
                return res.status(403).json({
                    sucess:false,
                    message:"Please verify your email to login"
                })
            }
            const existingSession = await Session.findOne({ userId: user._id });
            if (existingSession) {
                await Session.deleteOne({ userId: user._id })
                };

                await Session.create({ userId: user._id });

                    //Generate Tokens
                const accessToken = jwt.sign({ id: user._id }, process.env.SECRET_KEY, { expiresIn: "10d" })
                const refreshToken = jwt.sign({ id: user._id }, process.env.SECRET_KEY, { expiresIn: "30d" })
                user.isLoggedIn = true;
                await user.save();

                return res.satus(200).json({
                    success: true,
                    message: `Welcome Back! ${user.name}`,
                    accessToken,
                    refreshToken,
                    user
                })

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }