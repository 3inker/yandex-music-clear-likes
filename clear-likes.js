(function() {
    // Флаг для экстренной остановки процесса
    window.stopDelete = false;
    let deletedCount = 0;
    let emptyScrolls = 0;

    // Функция для клика с ожиданием подтверждения от интерфейса
    async function clickAndWait(btn) {
        // Если кнопка уже неактивна, пропускаем
        if (btn.getAttribute('aria-pressed') !== 'true') return;

        btn.click();
        
        // Ждем, пока Яндекс обработает клик (максимум 2 секунды)
        let attempts = 0;
        while (attempts < 20) {
            // Если трек удалился и кнопка исчезла со страницы — отлично
            if (!document.contains(btn)) return;
            
            // Если кнопка осталась, но статус сменился на "не нажата" — тоже отлично
            if (btn.getAttribute('aria-pressed') === 'false') return;
            
            // Ждем 100 мс и проверяем снова
            await new Promise(r => setTimeout(r, 100));
            attempts++;
        }
        console.warn("⚠️ Кнопка не ответила вовремя, двигаемся дальше...");
    }

    // Основная функция удаления
    async function deleteTracks() {
        // Находим контейнер виртуального скролла
        const scroller = document.querySelector('[data-test-id="virtuoso-scroller"]');
        
        if (!scroller) {
            console.error("❌ Не удалось найти контейнер списка. Убедитесь, что вы находитесь на странице плейлиста, и обновите страницу (F5).");
            return;
        }

        console.log("🚀 Запуск очистки плейлиста. Для остановки введите: window.stopDelete = true (или обновите страницу)");

        while (!window.stopDelete) {
            // Ищем активные лайки строго внутри строк с треками
            const likedButtons = document.querySelectorAll('[data-test-id="TRACK_PLAYLIST"] button[data-test-id="LIKE_BUTTON"][aria-pressed="true"]');

            if (likedButtons.length > 0) {
                emptyScrolls = 0; 
                
                // Берем первый лайкнутый трек
                let btn = likedButtons[0];
                
                // Кликаем и ждем, пока интерфейс отреагирует
                await clickAndWait(btn);
                deletedCount++;
                
                if (deletedCount % 10 === 0) {
                    console.log(`Удалено: ${deletedCount} треков...`);
                }
                
                // Дополнительная пауза 250 мс, чтобы дать серверу передохнуть и React обновить список
                await new Promise(r => setTimeout(r, 250));
            } else {
                // Если лайкнутых треков на экране нет, прокручиваем вниз
                emptyScrolls++;
                
                if (emptyScrolls > 20) {
                    console.log(`✅ Готово! Больше треков не найдено. Всего удалено: ${deletedCount}`);
                    break;
                }

                scroller.scrollBy(0, 1500);
                console.log(`Прокрутка вниз... (попытка ${emptyScrolls})`);
                
                // Ждем 1.5 секунды для загрузки новых треков
                await new Promise(r => setTimeout(r, 1500));
            }
        }

        if (window.stopDelete) {
            console.log(`🛑 Остановлено пользователем. Всего удалено: ${deletedCount}`);
        }
    }

    // Запуск
    deleteTracks();
})();