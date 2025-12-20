import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs'; // แนะนำใช้ bcryptjs บน Vercel (ไม่ต้องคอมไพล์ native)
@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService
    ) { }

    async validateUser(email: string, pass: string): Promise<any> {
  const user = await this.usersService.findOne(email);
  if (!user) return null;

  // เทียบรหัสผ่านกับ hash ในฐานข้อมูล
  const ok = await bcrypt.compare(pass, user.passwordHash);
  if (!ok) return null;

  // ไม่ส่ง hash กลับไป
  const { passwordHash, ...result } = user;
  return result;
}

    async login(user: any) {
        const payload = { username: user.email, sub: user.id, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
        };
    }
}
