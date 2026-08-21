import { NextFunction, Request, Response } from 'express';
import { Secret } from 'jsonwebtoken';
import config from '../../config';
import { verifyToken } from '../../utils/verifyToken';
import { User } from '../modules/user/user.model';

// Same shape as `auth`, but a missing/invalid token is not an error — the
// route just runs unauthenticated. Used where a response can be personalized
// for a logged-in caller (e.g. search) without requiring login.
const optionalAuth =
  () => async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const tokenWithBearer = req.headers.authorization;
      if (tokenWithBearer?.startsWith('Bearer')) {
        const token = tokenWithBearer.split(' ')[1];
        const verifyUser = verifyToken(token, config.jwt.jwt_secret as Secret);
        const user = await User.isExistUserById(verifyUser.id);

        if (user && user.status !== 'blocked' && !user.isDeleted) {
          req.user = verifyUser;
        }
      }
    } catch (error) {
      // invalid/expired token — proceed unauthenticated rather than failing
    }
    next();
  };

export default optionalAuth;
