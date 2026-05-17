"use server";
import { z } from "zod";
import postgres from "postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import bcrypt from "bcrypt";
import { randomUUID } from "crypto";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({ invalid_type_error: "Please provide a customer id." }),
  amount: z.coerce
    .number()
    .gt(99, { message: "Please enter an amount greater than $99." }),
  status: z.enum(["pending", "paid"], {
    message: "Please select an invoice status.",
  }),
  date: z.string(),
});

const RegisterSchema = z.object({
  name: z.string().min(3, {
    message: "Fullname should be at least 3 characters long.",
  }),
  email: z.string().email({
    message: "Please provide a valid email.",
  }),
  password: z.string().min(6, {
    message: "Please password should be at least 6 characters long.",
  }),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

export default async function createInvoice(
  prevState: State,
  formData: FormData,
) {
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Create Invoice.",
    };
  }

  const { amount, customerId, status } = validatedFields.data;

  const amountInCents = amount * 100;
  const date = new Date().toISOString().split("T")[0];

  try {
    await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
  `;
  } catch (error) {
    console.log(error);
    return {
      message: "Database Error: Failed to Create Invoice.",
    };
  }
  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

export async function updateInvoice(
  id: string,
  prevState: State,
  formData: FormData,
) {
  const validatedFields = UpdateInvoice.safeParse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Update Invoice.",
    };
  }

  const { amount, customerId, status } = validatedFields.data;

  const amountInCents = amount * 100;

  try {
    await sql`
    UPDATE invoices
    SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
    WHERE id = ${id}
  `;
  } catch (error) {
    console.log(error);
    return {
      message: "Database Error: Failed to Update Invoice.",
    };
  }

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

export async function deleteInvoice(id: string) {
  try {
    await sql`
    DELETE FROM invoices WHERE id = ${id}
    `;
  } catch (error) {
    console.log(error);
    return {
      message: "Database Error: Failed to Delete Invoice.",
    };
  }
  revalidatePath("/dashboard/invoices");
}

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn("credentials", formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Invalid credentials.";

        default:
          return "Something went wrong.";
      }
    }
    throw error;
  }
}

export async function register(
  prevState: {
    errors?: {
      name?: string[] | undefined;
      email?: string[] | undefined;
      password?: string[] | undefined;
    };
    message: string;
  },
  formData: FormData,
) {
  const validatedFields = RegisterSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Registration failed.",
    };
  }

  const { email, name, password } = validatedFields.data;

  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(password, salt);
  const id = randomUUID();

  try {
    await sql`INSERT INTO users (id, name, email, password)
        VALUES (${id}, ${name}, ${email}, ${hashedPassword})
        ON CONFLICT (id) DO NOTHING`;
  } catch (error) {
    console.log(error);
    return {
      message: "Error registering your account. Please try again later.",
    };
  }

  redirect("/login");
}