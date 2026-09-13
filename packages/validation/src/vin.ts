import { z } from "zod";

// VINs are 17 characters, excluding I/O/Q to avoid confusion with 1/0.
export const vinSchema = z
  .string()
  .length(17)
  .regex(/^[A-HJ-NPR-Z0-9]{17}$/, "Not a well-formed VIN");
