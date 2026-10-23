import { describe, it, expect, beforeAll } from "vitest";
import { encrypt, decrypt, maskPan, maskAadhaar, maskBankAccount, maskPhone } from "../encrypt";

beforeAll(() => {
  process.env.NEXTAUTH_SECRET = "test-secret-for-encryption-at-least-16-chars";
});

describe("encryption", () => {
  describe("encrypt/decrypt roundtrip", () => {
    it("encrypts and decrypts a PAN number", () => {
      const pan = "ABCDE1234F";
      const encrypted = encrypt(pan);
      expect(encrypted).not.toBe(pan);
      expect(encrypted.length).toBeGreaterThan(pan.length);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(pan);
    });

    it("encrypts and decrypts a bank account number", () => {
      const account = "12345678901234";
      const encrypted = encrypt(account);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(account);
    });

    it("encrypts and decrypts an empty string", () => {
      const encrypted = encrypt("");
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe("");
    });

    it("encrypts and decrypts unicode text", () => {
      const text = "रामेश कुमार";
      const encrypted = encrypt(text);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(text);
    });

    it("produces different ciphertext for same input (random salt)", () => {
      const pan = "ABCDE1234F";
      const encrypted1 = encrypt(pan);
      const encrypted2 = encrypt(pan);
      expect(encrypted1).not.toBe(encrypted2);
      // But both decrypt to same value
      expect(decrypt(encrypted1)).toBe(pan);
      expect(decrypt(encrypted2)).toBe(pan);
    });
  });

  describe("masking", () => {
    it("masks PAN correctly", () => {
      expect(maskPan("ABCDE1234F")).toBe("XXXXX1234F");
    });

    it("masks invalid PAN length", () => {
      expect(maskPan("SHORT")).toBe("XXXXXXXXXX");
    });

    it("masks Aadhaar with last 4", () => {
      expect(maskAadhaar("9012")).toBe("xxxx-xxxx-9012");
    });

    it("masks bank account", () => {
      expect(maskBankAccount("12345678901234")).toBe("XXXXXXXXXX1234");
    });

    it("masks short bank account", () => {
      expect(maskBankAccount("1234")).toBe("1234");
    });

    it("masks phone number", () => {
      expect(maskPhone("9876543210")).toBe("XXXXXX3210");
    });

    it("masks phone with country code", () => {
      expect(maskPhone("+91 9876543210")).toBe("XXXXXXXX3210");
    });
  });
});
