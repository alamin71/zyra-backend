import bcrypt from 'bcrypt';
import { model, Schema } from 'mongoose';
import config from '../../../config';
import { USER_ROLES, USER_STATUS } from '../../../enums/user';
import { IUser, UserModel } from './user.interface';

const userSchema = new Schema<IUser, UserModel>(
  {
    name: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.CUSTOMER,
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    countryCode: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      select: false,
      minlength: 8,
    },
    image: {
      type: String,
      default: '',
    },
    dob: {
      type: Date,
    },
    status: {
      type: String,
      enum: Object.values(USER_STATUS),
      default: USER_STATUS.ACTIVE,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    preferences: {
      language: {
        type: String,
        enum: ['ar', 'en'],
        default: 'en',
      },
      currency: {
        type: String,
        enum: ['SYP', 'USD', 'EUR'],
        default: 'SYP',
      },
    },
    recentSearches: {
      type: [
        {
          term: { type: String, required: true },
          searchedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
      select: false,
    },
    authentication: {
      type: {
        isResetPassword: {
          type: Boolean,
          default: false,
        },
        oneTimeCode: {
          type: Number,
          default: null,
        },
        expireAt: {
          type: Date,
          default: null,
        },
        pendingEmail: {
          type: String,
        },
        emailChangeOtp: {
          type: Number,
          default: null,
        },
        emailChangeExpireAt: {
          type: Date,
          default: null,
        },
      },
      select: false,
    },
  },
  { timestamps: true }
);

// Exist User Checks
userSchema.statics.isExistUserById = async (id: string) => {
  return await User.findById(id);
};

userSchema.statics.isExistUserByEmail = async (email: string) => {
  return await User.findOne({ email });
};

userSchema.statics.isExistUserByPhone = async (phone: string) => {
  return await User.findOne({ phone });
};

// Password Matching
userSchema.statics.isMatchPassword = async (
  password: string,
  hashPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hashPassword);
};

// Pre-Save Hook for Hashing Password (only relevant for ADMIN/SUPER_ADMIN, which are
// the only roles that ever set a password — CUSTOMER/VENDOR authenticate via phone OTP)
userSchema.pre('save', async function (next) {
  if (this.isModified('password') && this.password) {
    this.password = await bcrypt.hash(
      this.password,
      Number(config.bcrypt_salt_rounds)
    );
  }
  next();
});

// Query Middleware
userSchema.pre('find', function (next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

userSchema.pre('findOne', function (next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

userSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { isDeleted: { $ne: true } } });
  next();
});

export const User = model<IUser, UserModel>('User', userSchema);
