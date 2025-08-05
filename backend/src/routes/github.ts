import { Request, Response, Router } from "express";
import axios from "axios";
import jwt from "jsonwebtoken";
import AutoReview from "../model/autoReview.model";

const router = Router();

router.post("/callback", async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    const client_id: string = process.env.GITHUB_CLIENT_ID!;
    const client_secret: string = process.env.GITHUB_CLIENT_SECRET!;

    console.log("code is: ", code);
    console.log("code is: ", client_id);
    console.log("code is: ", client_secret);

    const tokenRes: any = await axios.post(
      "https://github.com/login/oauth/access_token",
      { client_id, client_secret, code },
      { headers: { Accept: "application/json" } }
    );

    const access_token = tokenRes.data.access_token;
    if (!access_token)
      return res.status(401).json({ error: "No access token" });

    // Get user info from GitHub
    const userRes = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `token ${access_token}` },
    });

    const { login, id, avatar_url, email }: any = userRes.data;

    console.log("user result is: ", userRes.data);

    const token = jwt.sign(
      { githubId: id, username: login, access: access_token },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    console.log("done");

    res.status(201).json({ token, access_token, user: userRes.data });
  } catch (error) {
    return res.status(500).json({
      message: "error while github auth",
      error,
    });
  }
});

// POST: Store AutoReview ON
router.post("/store/autoreview", async (req: Request, res: Response) => {
  try {
    const { repo_id, user_id, autoReview } = req.body;

    if (!repo_id || !user_id) {
      return res.status(400).json({ message: "repo_id and user_id are required" });
    }

    const existing = await AutoReview.findOne({ userId: user_id, repoId: repo_id });

    if (existing) {
      return res.status(200).json({ message: "Already enabled" });
    }

    const created = await AutoReview.create({ userId: user_id, repoId: repo_id, autoReview });

    return res.status(201).json({
      message: "Auto Review enabled",
      data: created,
    });
  } catch (error) {
    return res.status(500).json({ message: "Error enabling Auto Review", error });
  }
});

// DELETE: Remove AutoReview (OFF)
router.delete("/delete/autoreview", async (req: Request, res: Response) => {
  try {
    const { repo_id, user_id } = req.body;

    if (!repo_id || !user_id) {
      return res.status(400).json({ message: "repo_id and user_id are required" });
    }

    const deleted = await AutoReview.deleteOne({ userId: user_id, repoId: repo_id });

    return res.status(200).json({
      message: "Auto Review disabled",
      deleted
    });
  } catch (error) {
    return res.status(500).json({ message: "Error disabling Auto Review", error });
  }
});


router.post("/status/autoreview", async (req: Request, res: Response) => {
  try {
    const {user_id} = req.body;

    if(user_id) {
      return res.status(500).json({
        message: "repo and user id are not present"
      })
    }

    const isthere = await AutoReview.find(user_id);

    if(!isthere) {
      return res.status(201).json({
        status: false
      })
    }

    return res.status(201).json({
      status: true,
      list: isthere
    })
  } catch (error) {
    return res.status(500).json({
      message: "error in status autoreview",
      error
    })
  }
})


export default router;
