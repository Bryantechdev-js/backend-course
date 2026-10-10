import z from "zod";

const userSchema = z.object({
    name:z.string().min(2,"minimum expected is 2").max(100,"maximum expected is 100"),
    email:z.string().email("invalid email format"),
    password:z.string().min(6,"minimum expected is 6").max(100,"maximum expected is 100")
})

const postSchema = z.object({
    title:z.string().min(2,"minimum expected is 2").max(100,"maximum expected is 100"),
    content:z.string().min(2,"minimum expected is 2").max(100,"maximum expected is 100")
})

export default {
    userSchema,
    postSchema
}