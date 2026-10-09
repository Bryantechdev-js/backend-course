import { Router } from "express";

const router = Router();

router.get("/", async (req, res) => {
  res.status(200).json({
    success: true,
    data: []
  });
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;

  res.status(200).json({
    success: true,
    data: { id }
  });
});

router.post("/", async (req, res) => {
  res.status(201).json({
    success: true,
    data: req.body
  });
});

router.patch("/:id", async (req, res) => {
  const { id } = req.params;

  res.status(200).json({
    success: true,
    data: {
      id,
      ...req.body
    }
  });
});

router.delete("/:id", async (req, res) => {
  res.status(204).send();
});

export default router;