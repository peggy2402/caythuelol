import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import * as crypto from 'crypto';

// 1. TEST SUITE: TÁCH TOKEN & USERNAME TỪ NỘI DUNG CHUYỂN KHOẢN CỦA 15+ NGÂN HÀNG VN
test('Parse nội dung chuyển khoản từ các ngân hàng Việt Nam', async (t) => {
  const tokenRegex = /(?:^|[^a-zA-Z0-9])(?:ZT|LR)\s*([a-zA-Z0-9_\-]+)(?=[^a-zA-Z0-9_\-]|$)/gi;

  function extractCandidates(content: string): string[] {
    const candidates: string[] = [];
    let m: RegExpExecArray | null;
    tokenRegex.lastIndex = 0;
    while ((m = tokenRegex.exec(content)) !== null) {
      const cand = m[1].trim();
      if (cand && !candidates.includes(cand)) {
        candidates.push(cand);
      }
    }
    return candidates;
  }

  const testCases = [
    {
      bank: 'Vietcombank (có dấu chấm và .CT)',
      input: 'MBVCB.102844931.ZTvewad59246.CT tu 0123456789 NGUYEN VAN A',
      expected: 'vewad59246',
    },
    {
      bank: 'Vietcombank chữ hoa',
      input: 'MBVCB.689234123.ZTVEWAD59246.chuyen khoan',
      expected: 'VEWAD59246',
    },
    {
      bank: 'Techcombank có dấu gạch chéo ngược',
      input: 'FT24012345678901\\ZTvewad59246',
      expected: 'vewad59246',
    },
    {
      bank: 'Techcombank có khoảng trắng sau FT',
      input: 'FT24012345678901 ZTvewad59246 NAP TIEN',
      expected: 'vewad59246',
    },
    {
      bank: 'MB Bank có dấu gạch nối',
      input: '0123456789-ZTvewad59246 chuyen tien',
      expected: 'vewad59246',
    },
    {
      bank: 'Cú pháp chuẩn ZT<username>',
      input: 'ZTvewad59246 chuyen tien',
      expected: 'vewad59246',
    },
    {
      bank: 'Cú pháp có khoảng trắng giữa ZT và username',
      input: 'ZT vewad59246 chuyen tien',
      expected: 'vewad59246',
    },
    {
      bank: 'ACB',
      input: 'ACBSTP 123456 ZTvewad59246 chuyen tien',
      expected: 'vewad59246',
    },
    {
      bank: 'VPBank',
      input: 'VPB.123456789.ZTvewad59246.Nap tien',
      expected: 'vewad59246',
    },
    {
      bank: 'BIDV có dấu chấm phẩy',
      input: 'BIDV;123456;ZTvewad59246;NGUYEN VAN A',
      expected: 'vewad59246',
    },
    {
      bank: 'VietinBank chuyển song phương',
      input: 'CT song phuong ZTvewad59246 tu 123456',
      expected: 'vewad59246',
    },
    {
      bank: 'TPBank',
      input: '12345678 ZTvewad59246 NAP TIEN',
      expected: 'vewad59246',
    },
    {
      bank: 'Agribank',
      input: 'ZTvewad59246 1234567890',
      expected: 'vewad59246',
    },
    {
      bank: 'OCB',
      input: 'OCB 987654321 ZTvewad59246',
      expected: 'vewad59246',
    },
    {
      bank: 'Username có gạch dưới booster_chovy',
      input: 'ZTbooster_chovy nap tien',
      expected: 'booster_chovy',
    },
    {
      bank: 'Tiền tố LR (LeoRank)',
      input: 'LRvewad59246 chuyen tien',
      expected: 'vewad59246',
    },
    {
      bank: 'Tiền tố LR có khoảng trắng',
      input: 'LR vewad59246 nap tien',
      expected: 'vewad59246',
    },
    {
      bank: 'Ngân hàng ghép mã giao dịch số vào đuôi',
      input: 'ZTvewad59246102844931',
      expectedRaw: 'vewad59246102844931',
      expectedPrefixMatch: 'vewad59246',
    },
  ];

  for (const tc of testCases) {
    const cands = extractCandidates(tc.input);
    assert.ok(cands.length > 0, `Không trích xuất được token từ: ${tc.input}`);
    if (tc.expected) {
      assert.equal(cands[0], tc.expected, `Lệch kết quả cho bank [${tc.bank}]: ${cands[0]} != ${tc.expected}`);
    } else if (tc.expectedPrefixMatch) {
      const raw = cands[0];
      const prefixes: string[] = [];
      for (let len = 6; len <= 12; len++) {
        if (raw.length - len >= 3) prefixes.push(raw.slice(0, -len));
      }
      assert.ok(prefixes.includes(tc.expectedPrefixMatch), `Prefixes không chứa ${tc.expectedPrefixMatch}: [${prefixes.join(', ')}]`);
    }
  }
});

// 2. TEST SUITE: XÁC THỰC WEBHOOK TIMING SAFE EQUAL
test('Xác thực Webhook Authorization timingSafeEqual', async () => {
  const secretKey = 'spsk_live_test_secret_key_12345';

  function verifyAuth(header: string | undefined, configuredKey: string): boolean {
    if (!configuredKey || !header) return false;
    const match = header.trim().match(/^apikey\s+(.+)$/i);
    if (!match) return false;
    const receivedKey = match[1].trim();
    const expectedBuf = Buffer.from(configuredKey, 'utf-8');
    const receivedBuf = Buffer.from(receivedKey, 'utf-8');
    if (expectedBuf.length !== receivedBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, receivedBuf);
  }

  // Hợp lệ
  assert.equal(verifyAuth(`Apikey ${secretKey}`, secretKey), true);
  assert.equal(verifyAuth(`apikey ${secretKey}`, secretKey), true);
  assert.equal(verifyAuth(`APIKEY ${secretKey}`, secretKey), true);

  // Không hợp lệ
  assert.equal(verifyAuth(`Bearer ${secretKey}`, secretKey), false);
  assert.equal(verifyAuth(secretKey, secretKey), false);
  assert.equal(verifyAuth(`Apikey wrong_key`, secretKey), false);
  assert.equal(verifyAuth(`Apikey ${secretKey}_extra`, secretKey), false);
  assert.equal(verifyAuth(undefined, secretKey), false);
});

// 2b. TEST SUITE: XÁC THỰC HMAC-SHA256 CHUẨN SEPAY
test('Xác thực Webhook HMAC-SHA256 chuẩn SePay ({timestamp}.{raw_body})', async () => {
  const secretKey = 'sepay_hmac_secret_key_abcdef123456';
  const now = Math.floor(Date.now() / 1000);
  const samplePayload = JSON.stringify({
    id: 102844931,
    gateway: 'Vietcombank',
    transferType: 'in',
    transferAmount: 1000000,
    content: 'MBVCB.102844931.ZTvewad59246.CT',
  });

  function computeHmac(timestamp: number, body: string, key: string): string {
    return crypto
      .createHmac('sha256', key)
      .update(`${timestamp}.${body}`)
      .digest('hex');
  }

  function verifyHmac(
    signature: string | undefined,
    timestampStr: string | undefined,
    body: string,
    key: string,
  ): boolean {
    if (!signature || !timestampStr || !body || !key) return false;
    const ts = Number(timestampStr);
    const current = Math.floor(Date.now() / 1000);
    if (isNaN(ts) || Math.abs(current - ts) > 300) return false;

    const hash = signature.replace(/^sha256=/i, '').trim();
    const computed = computeHmac(ts, body, key);

    const compBuf = Buffer.from(computed, 'utf-8');
    const expBuf = Buffer.from(hash, 'utf-8');
    if (compBuf.length !== expBuf.length) return false;
    return crypto.timingSafeEqual(compBuf, expBuf);
  }

  const validSig = computeHmac(now, samplePayload, secretKey);

  // 1. Chữ ký hợp lệ dạng bare hex
  assert.equal(verifyHmac(validSig, String(now), samplePayload, secretKey), true);

  // 2. Chữ ký hợp lệ có prefix sha256=
  assert.equal(verifyHmac(`sha256=${validSig}`, String(now), samplePayload, secretKey), true);

  // 3. Sửa đổi payload (Tampered body: kẻ gian đổi số tiền từ 1.000.000 thành 5.000.000)
  const tamperedPayload = JSON.stringify({
    id: 102844931,
    gateway: 'Vietcombank',
    transferType: 'in',
    transferAmount: 5000000, // Đã bị sửa!
    content: 'MBVCB.102844931.ZTvewad59246.CT',
  });
  assert.equal(verifyHmac(validSig, String(now), tamperedPayload, secretKey), false);

  // 4. Timestamp quá hạn (Chống Replay attack: cũ hơn 5 phút)
  const expiredTimestamp = now - 400; // 400s trước
  const expiredSig = computeHmac(expiredTimestamp, samplePayload, secretKey);
  assert.equal(verifyHmac(expiredSig, String(expiredTimestamp), samplePayload, secretKey), false);

  // 5. Sai secret key
  const wrongKeySig = computeHmac(now, samplePayload, 'wrong_secret_key');
  assert.equal(verifyHmac(wrongKeySig, String(now), samplePayload, secretKey), false);
});

// 3. TEST SUITE: IDEMPOTENCY MÔ PHỎNG GỬI 2 LẦN VÀ SONG SONG
test('Idempotency: Gửi cùng 1 Webhook 2 lần hoặc song song chỉ xử lý 1 lần', async () => {
  const processedTransactions = new Set<string>();
  let balance = 0;
  let creditCount = 0;

  async function handleWebhook(data: { id: number; amount: number }) {
    const txId = String(data.id);
    // Atomic check & claim
    if (processedTransactions.has(txId)) {
      return { success: true, message: 'Transaction already processed' };
    }
    processedTransactions.add(txId);
    balance += data.amount;
    creditCount++;
    return { success: true, message: 'Credited' };
  }

  // Gửi lần 1
  const res1 = await handleWebhook({ id: 102844931, amount: 1000000 });
  assert.equal(res1.message, 'Credited');
  assert.equal(balance, 1000000);
  assert.equal(creditCount, 1);

  // Gửi lần 2 (Retry)
  const res2 = await handleWebhook({ id: 102844931, amount: 1000000 });
  assert.equal(res2.message, 'Transaction already processed');
  assert.equal(balance, 1000000); // Không cộng 2 lần!
  assert.equal(creditCount, 1);

  // Gửi song song 10 requests cùng transaction ID
  const parallelPromises = Array.from({ length: 10 }).map(() =>
    handleWebhook({ id: 999999999, amount: 500000 })
  );
  await Promise.all(parallelPromises);

  assert.equal(creditCount, 2); // Chỉ tăng 1 lần cho ID 999999999
  assert.equal(balance, 1500000);
});

// 4. TEST SUITE: NHÁNH MƠ HỒ (AMBIGUOUS) VÀ KHÔNG KHỚP USER -> ROUTE VÀO UNMATCHED
test('Unmatched: Không khớp user hoặc mơ hồ thì không tự ý cộng tiền, ghi nhận hàng đợi', async () => {
  const unmatchedQueue: any[] = [];
  let walletBalance = 0;

  function mockResolve(candidates: string[]) {
    if (candidates.length === 0) return { error: 'NO_CANDIDATE' };
    if (candidates.length > 1) return { error: 'AMBIGUOUS' };
    if (candidates[0] === 'non_existing_user') return { error: 'USER_NOT_FOUND' };
    return { user: { username: candidates[0], id: 'u1' } };
  }

  function handleProcess(candidates: string[], amount: number, id: number) {
    const res = mockResolve(candidates);
    if (res.error) {
      unmatchedQueue.push({ id, amount, reason: res.error, status: 'PENDING_REVIEW' });
      return { success: true, unmatched: true, reason: res.error };
    }
    walletBalance += amount;
    return { success: true, user: res.user };
  }

  // Case 1: Không có cú pháp ZT/LR
  const res1 = handleProcess([], 100000, 1);
  assert.equal(res1.unmatched, true);
  assert.equal(walletBalance, 0);
  assert.equal(unmatchedQueue.length, 1);

  // Case 2: Nhiều user cùng khớp (mơ hồ)
  const res2 = handleProcess(['user_a', 'user_b'], 200000, 2);
  assert.equal(res2.unmatched, true);
  assert.equal(walletBalance, 0);
  assert.equal(unmatchedQueue.length, 2);

  // Case 3: 1 user hợp lệ
  const res3 = handleProcess(['vewad59246'], 500000, 3);
  assert.equal(res3.unmatched, undefined);
  assert.equal(walletBalance, 500000);
  assert.equal(unmatchedQueue.length, 2);
});
