import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProductUtilityService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate a unique product ID based on current date + sequence
   * Format: YYYYMMDD + sequence (e.g., 202601051)
   */
  async generateProductId(): Promise<number> {
    // Get current date in YYYYMMDD format (8 digits)
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const datePrefix = `${year}${month}${day}`; // "20260201"
    const datePrefixInt = parseInt(datePrefix, 10);

    // Find all products created today (IDs starting with today's date)
    const todayMinId = datePrefixInt * 10; // 202602010
    const allProducts = await this.prisma.product.findMany({
      where: {
        id: {
          gte: todayMinId,
        },
      },
      select: {
        id: true,
      },
    });

    // Filter products that start with today's date prefix and find max sequence
    let maxSequence = 0;
    for (const product of allProducts) {
      const idStr = String(product.id);
      if (idStr.startsWith(datePrefix)) {
        // Extract sequence part (everything after the 8-digit date prefix)
        const sequenceStr = idStr.slice(datePrefix.length);
        const sequence = parseInt(sequenceStr, 10);
        if (!isNaN(sequence) && sequence > maxSequence) {
          maxSequence = sequence;
        }
      }
    }

    // Generate next ID: datePrefix + (maxSequence + 1)
    const nextSequence = maxSequence + 1;
    const newId = parseInt(`${datePrefix}${nextSequence}`, 10);

    return newId;
  }

  /**
   * Convert a product name to a URL-friendly slug
   */
  generateSlugFromName(name: string): string {
    return name
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  /**
   * Ensure slug is unique by appending a number if needed
   */
  async ensureUniqueSlug(baseSlug: string): Promise<string> {
    let candidate = baseSlug || 'product';
    let suffix = 0;

    while (true) {
      const existing = await this.prisma.product.findFirst({
        where: { slug: candidate },
        select: { id: true },
      });
      if (!existing) return candidate;
      suffix += 1;
      candidate = `${baseSlug}-${suffix}`;
    }
  }
}
