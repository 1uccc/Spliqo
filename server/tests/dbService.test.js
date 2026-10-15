import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs, { promises as fsPromises } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dbService } from '../services/dbService.js';

describe('dbService (Debounced Asynchronous File Persistence)', () => {
  it('cung cấp phương thức saveData và flush bất đồng bộ', () => {
    expect(typeof dbService.saveData).toBe('function');
    expect(typeof dbService.flush).toBe('function');
  });

  it('hoãn ghi đĩa và gom nhiều lần saveData dồn dập thành 1 lần ghi duy nhất', async () => {
    const writeFileSpy = vi.spyOn(fsPromises, 'writeFile').mockResolvedValue();

    try {
      // Gọi saveData 5 lần liên tiếp trong vài ms
      dbService.saveData();
      dbService.saveData();
      dbService.saveData();
      dbService.saveData();
      dbService.saveData();

      // Ngay lập tức writeFile chưa được gọi vì đang nằm trong debounce window
      expect(writeFileSpy).toHaveBeenCalledTimes(0);

      // Đợi flush xong
      await dbService.flush();

      // Chỉ gọi writeFile đúng 1 lần duy nhất thay vì 5 lần dồn dập
      expect(writeFileSpy).toHaveBeenCalledTimes(1);
    } finally {
      writeFileSpy.mockRestore();
    }
  });

  it('hỗ trợ ghi ngay lập tức khi truyền immediate = true', async () => {
    const writeFileSpy = vi.spyOn(fsPromises, 'writeFile').mockResolvedValue();

    try {
      await dbService.saveData(null, true);
      expect(writeFileSpy).toHaveBeenCalledTimes(1);
    } finally {
      writeFileSpy.mockRestore();
    }
  });
});
