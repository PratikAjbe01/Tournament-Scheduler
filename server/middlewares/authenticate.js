import jwt from "jsonwebtoken";

const isAuthenticated = (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token)
      return res.status(401).json({ message: "Please login to access this resource" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?.id)
      return res.status(401).json({ message: "UserId not found" });

    
    req.user = { _id: decoded.id };

    next();
  } catch (error) {
    console.error("Auth Error:", error.message);
    return res.status(401).json({ message: "Authentication failed" });
  }
};

export default isAuthenticated;
