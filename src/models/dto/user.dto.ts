// src/dto/login.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';
import { User } from "@/common/interfaces";
import { APIResponse } from "./api.response";

export class LoginRequest {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class LoginResponse extends APIResponse {
  user: User;
  token: string;
}