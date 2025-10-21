import jwt from 'jsonwebtoken';

const authJwt = {
  verifyToken: (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    
    if (!token) {
      return res.status(403).json({ error: 'Token no proporcionado' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({ error: 'Token inválido o expirado' });
      }
      req.userId = decoded.id;
      req.username = decoded.username;
      next();
    });
  }
};

export default authJwt;