import dotenv from "dotenv";
import express, { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
	throw new Error("Missing JWT_SECRET in environment");
}

function signToken(payload: object): string {
	return jwt.sign(payload, jwtSecret as string, { expiresIn: "7d" });
}

app.post("/signup", async (req: Request, res: Response, _next: NextFunction) => {
	try {
		const { name, email, password } = req.body as { name?: string; email?: string; password?: string };
		if (!name || !email || !password) {
			return res.status(400).json({ error: "name, email and password are required" });
		}

		const existing = await prisma.user.findUnique({ where: { email } });
		if (existing) {
			return res.status(409).json({ error: "email already in use" });
		}

		const passwordHash = await bcrypt.hash(password, 10);
		const user = await prisma.user.create({ data: { email, password: passwordHash, name } });
		const token = signToken({ sub: user.id, email: user.email });
		return res.status(201).json({ token, user: { id: user.id, email: user.email } });
	} catch (err) {
		console.error("/signup error", err);
		return res.status(500).json({ error: "internal server error" });
	}
});

app.post("/signin", async (req: Request, res: Response, _next: NextFunction) => {
	try {
		const { email, password } = req.body as { email?: string; password?: string };
		if (!email || !password) {
			return res.status(400).json({ error: "email and password are required" });
		}

		const user = await prisma.user.findUnique({ where: { email } });
		if (!user) {
			return res.status(401).json({ error: "invalid credentials" });
		}

		const valid = await bcrypt.compare(password, user.password);
		if (!valid) {
			return res.status(401).json({ error: "invalid credentials" });
		}

		const token = signToken({ sub: user.id, email: user.email });
		return res.status(200).json({ token, user: { id: user.id, email: user.email, name: user.name } });
	} catch (err) {
		console.error("/signin error", err);
		return res.status(500).json({ error: "internal server error" });
	}
});

app.get("/health", (_req: Request, res: Response) => {
	res.json({ status: "ok" });
});

const port = Number(process.env.PORT);
app.listen(port, () => {
	console.log(`auth service listening on port ${port}`);
});
