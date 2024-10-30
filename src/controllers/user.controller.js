import {asyncHandler} from "../utils/asyncHandler.js"; 
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.models.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
    // res.status(200).json({
    //     message: "ok",
    // });

    /*
    get user details from frontend
    validation - not empty
    check if user already exists: username, email
    check for images, check for avatar
    upload them to cloudinary, avatar
    create user object - create entry in db
    remove pwd and refresh token field from response
    check for user creation
    return res
    */
//
    const {fullName, email, username, password} = req.body;
    // console.log("email: ", email);
    // console.log(`request.body = ${req.body}`);

    // if(fullName === ""){
    //     throw new ApiError(400, "Full name is required!!!");
    // }

//
    if(
        [fullName, email, username, password].some((field) =>{
            return field?.trim() === "";
        })
    ){
        throw new ApiError(400, "All fields are required!!!");
    }

//
    const existedUser = await User.findOne({
        $or: [{username}, {email}]
    });
    // console.log(`existedUser = ${existedUser}`);

    if(existedUser){
        throw new ApiError(409, "User with email or Username already exists!!!");
    }

//
    console.log(req.files);
    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required");
    }

//
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(400, "Avatar file is required!!!");
    }

//
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase(),

    });

//
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

//
    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user");
    }

//
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    );

});

export {registerUser};