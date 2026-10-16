
import time

from app import app, chat_histories


def test_tippy():
    client = app.test_client()
    test_chat_id = "test_tippy_empathy"

    test_messages = [
        {
            "name": "TEST 1 - Curhat tentang kuliah",
            "message": (
                "Aku capek banget sama kuliah. "
                "Rasanya semua orang lebih pintar daripada aku."
            ),
        },
        {
            "name": "TEST 2 - Tidak ingin solusi",
            "message": (
                "Aku cuma pengen cerita, nggak butuh solusi dulu."
            ),
        },
        {
            "name": "TEST 3 - Mengingat konteks",
            "message": (
                "Aku masih kepikiran soal yang tadi aku ceritain."
            ),
        },
        {
            "name": "TEST 4 - Pengguna meminta saran",
            "message": (
                "Menurutmu, aku harus gimana supaya "
                "nggak terus membandingkan diriku dengan teman-teman?"
            ),
        },
        {
            "name": "TEST 5 - Pengguna belum siap bercerita",
            "message": (
                "Aku belum siap cerita lebih jauh. "
                "Aku cuma ingin diam sebentar."
            ),
        },
    ]

    results = []

    # Siapkan sesi khusus pengujian
    with client.session_transaction() as session:
        session["chat_id"] = test_chat_id

    chat_histories[test_chat_id] = []

    try:
        with client:
            for test in test_messages:
                print("\n" + "=" * 55)
                print(test["name"])
                print("PENGGUNA:", test["message"])

                response = None

                # Maksimal 3 percobaan untuk error sementara
                for attempt in range(1, 4):
                    response = client.post(
                        "/chat",
                        json={"message": test["message"]},
                    )

                    if response.status_code == 200:
                        break

                    error_data = {}
                    if response.is_json:
                        error_data = response.get_json() or {}

                    error_detail = str(
                        error_data.get("error_detail", "")
                    )

                    temporary_error = (
                        response.status_code in (429, 502, 503, 504)
                        or "503 UNAVAILABLE" in error_detail
                    )

                    if temporary_error and attempt < 3:
                        print(
                            f"Gemini sedang bermasalah. "
                            f"Mencoba lagi ({attempt}/3)..."
                        )
                        time.sleep(2)
                    else:
                        break

                print("STATUS HTTP:", response.status_code)

                if response.is_json:
                    result = response.get_json() or {}

                    if response.status_code == 200:
                        print("\nBALASAN TIPPY:")
                        print(result.get("reply", "(Balasan kosong)"))
                        results.append((test["name"], "BERHASIL"))
                    else:
                        print("\nDETAIL ERROR:")
                        print(result)
                        results.append((test["name"], "GAGAL"))
                else:
                    print(response.get_data(as_text=True))
                    results.append((test["name"], "GAGAL"))

                print(
                    "\nTOTAL PESAN TERSIMPAN:",
                    len(chat_histories.get(test_chat_id, [])),
                )

    finally:
        # Hapus hanya riwayat khusus pengujian
        chat_histories.pop(test_chat_id, None)

    print("\n" + "=" * 55)
    print("RINGKASAN PENGUJIAN TIPPY")

    for name, status in results:
        print(f"{status}: {name}")

    passed = sum(1 for _, status in results if status == "BERHASIL")
    failed = sum(1 for _, status in results if status == "GAGAL")

    print(f"\nBerhasil: {passed}/{len(test_messages)}")
    print(f"Gagal:    {failed}/{len(test_messages)}")

    if failed:
        print(
            "\nTes yang gagal mungkin perlu diulang "
            "ketika layanan Gemini kembali tersedia."
        )


if __name__ == "__main__":
    test_tippy()
