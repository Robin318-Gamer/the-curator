-- ============================================================================
-- HK01 Scraper Categories - INSERT Statements WITH METADATA
-- Generated: 2025-12-06
-- Total Categories: 94 (Zones + Channels)
-- ============================================================================
-- Instructions:
-- 1. Ensure 'hk01' source exists in news_sources table
-- 2. Run this script in Supabase SQL Editor
-- 3. Metadata includes zoneId and zoneUrl for each category
-- ============================================================================

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '1-港聞', '港聞', 99, true, '{"zoneId": "1", "zoneUrl": "https://www.hk01.com/zone/1/%E6%B8%AF%E8%81%9E"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '2-社會新聞', '社會新聞', 98, true, '{"zoneId": "2", "zoneUrl": "https://www.hk01.com/channel/2/%E7%A4%BE%E6%9C%83%E6%96%B0%E8%81%9E"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '6-突發', '突發', 97, true, '{"zoneId": "6", "zoneUrl": "https://www.hk01.com/channel/6/%E7%AA%81%E7%99%BC"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '310-政情', '政情', 96, true, '{"zoneId": "310", "zoneUrl": "https://www.hk01.com/channel/310/%E6%94%BF%E6%83%85"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '143-偵查', '偵查', 95, true, '{"zoneId": "143", "zoneUrl": "https://www.hk01.com/channel/143/01%E5%81%B5%E6%9F%A5"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '23-教育', '教育', 94, true, '{"zoneId": "23", "zoneUrl": "https://www.hk01.com/zone/23/%E6%95%99%E8%82%B2"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '413-深度', '深度', 93, true, '{"zoneId": "413", "zoneUrl": "https://www.hk01.com/channel/413/%E6%B7%B1%E5%BA%A6%E5%A0%B1%E9%81%93"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '403-香港經濟', '香港經濟', 92, true, '{"zoneId": "403", "zoneUrl": "https://www.hk01.com/channel/403/%E9%A6%99%E6%B8%AF%E7%B6%93%E6%BF%9F"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '421-天氣', '天氣', 91, true, '{"zoneId": "421", "zoneUrl": "https://www.hk01.com/channel/421/%E5%A4%A9%E6%B0%A3"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '2-娛樂', '娛樂', 90, true, '{"zoneId": "2", "zoneUrl": "https://www.hk01.com/zone/2/%E5%A8%9B%E6%A8%82"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '22-即時娛樂', '即時娛樂', 89, true, '{"zoneId": "22", "zoneUrl": "https://www.hk01.com/channel/22/%E5%8D%B3%E6%99%82%E5%A8%9B%E6%A8%82"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '488-人氣娛樂', '人氣娛樂', 88, true, '{"zoneId": "488", "zoneUrl": "https://www.hk01.com/channel/488/%E4%BA%BA%E6%B0%A3%E5%A8%9B%E6%A8%82"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '66-電影', '電影', 87, true, '{"zoneId": "66", "zoneUrl": "https://www.hk01.com/channel/66/%E9%9B%BB%E5%BD%B1"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '447-眾樂迷', '眾樂迷', 86, true, '{"zoneId": "447", "zoneUrl": "https://www.hk01.com/channel/447/%E7%9C%BE%E6%A8%82%E8%BF%B7"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '4-國際', '國際', 85, true, '{"zoneId": "4", "zoneUrl": "https://www.hk01.com/zone/4/%E5%9C%8B%E9%9A%9B"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '19-即時國際', '即時國際', 84, true, '{"zoneId": "19", "zoneUrl": "https://www.hk01.com/channel/19/%E5%8D%B3%E6%99%82%E5%9C%8B%E9%9A%9B"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '406-環球趣聞', '環球趣聞', 83, true, '{"zoneId": "406", "zoneUrl": "https://www.hk01.com/channel/406/%E7%92%B0%E7%90%83%E8%B6%A3%E8%81%9E"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '407-國際分析', '國際分析', 82, true, '{"zoneId": "407", "zoneUrl": "https://www.hk01.com/channel/407/%E5%9C%8B%E9%9A%9B%E5%88%86%E6%9E%90"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '405-世界專題', '世界專題', 81, true, '{"zoneId": "405", "zoneUrl": "https://www.hk01.com/channel/405/%E4%B8%96%E7%95%8C%E5%B0%88%E9%A1%8C"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '259-紀實影像', '紀實影像', 80, true, '{"zoneId": "259", "zoneUrl": "https://www.hk01.com/channel/259/%E7%B4%80%E5%AF%A6"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '5-中國', '中國', 79, true, '{"zoneId": "5", "zoneUrl": "https://www.hk01.com/zone/5/%E4%B8%AD%E5%9C%8B"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '364-即時中國', '即時中國', 78, true, '{"zoneId": "364", "zoneUrl": "https://www.hk01.com/channel/364/%E5%8D%B3%E6%99%82%E4%B8%AD%E5%9C%8B"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '366-大國小事', '大國小事', 77, true, '{"zoneId": "366", "zoneUrl": "https://www.hk01.com/channel/366/%E5%A4%A7%E5%9C%8B%E5%B0%8F%E4%BA%8B"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '477-北上廣東', '北上廣東', 76, true, '{"zoneId": "477", "zoneUrl": "https://www.hk01.com/channel/477/%E5%8C%97%E4%B8%8A%E5%BB%A3%E6%9D%B1"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '369-藝文中國', '藝文中國', 75, true, '{"zoneId": "369", "zoneUrl": "https://www.hk01.com/channel/369/%E8%97%9D%E6%96%87%E4%B8%AD%E5%9C%8B"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '458-中國觀察', '中國觀察', 74, true, '{"zoneId": "458", "zoneUrl": "https://www.hk01.com/channel/458/%E4%B8%AD%E5%9C%8B%E8%A7%80%E5%AF%9F"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '367-台灣新聞', '台灣新聞', 73, true, '{"zoneId": "367", "zoneUrl": "https://www.hk01.com/channel/367/%E5%8F%B0%E7%81%A3%E6%96%B0%E8%81%9E"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '8-生活', '生活', 72, true, '{"zoneId": "8", "zoneUrl": "https://www.hk01.com/zone/8/%E7%94%9F%E6%B4%BB"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '38-教煮', '教煮', 71, true, '{"zoneId": "38", "zoneUrl": "https://www.hk01.com/channel/38/%E6%95%99%E7%85%AE"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '26-親子', '親子', 70, true, '{"zoneId": "26", "zoneUrl": "https://www.hk01.com/channel/26/%E8%A6%AA%E5%AD%90"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '28-寵物', '寵物', 69, true, '{"zoneId": "28", "zoneUrl": "https://www.hk01.com/channel/28/%E5%AF%B5%E7%89%A9"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '142-教育職場', '教育職場', 68, true, '{"zoneId": "142", "zoneUrl": "https://www.hk01.com/channel/142/%E8%81%B7%E5%A0%B4"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '25-好生活', '好生活', 67, true, '{"zoneId": "25", "zoneUrl": "https://www.hk01.com/channel/25/%E5%A5%BD%E7%94%9F%E6%B4%BB"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '442-網購攻略', '網購攻略', 66, true, '{"zoneId": "442", "zoneUrl": "https://www.hk01.com/channel/442/%E7%B6%B2%E8%B3%BC%E6%94%BB%E7%95%A5"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '11-科技', '科技', 65, true, '{"zoneId": "11", "zoneUrl": "https://www.hk01.com/zone/11/%E7%A7%91%E6%8A%80%E7%8E%A9%E7%89%A9"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '445-實用教學', '實用教學', 64, true, '{"zoneId": "445", "zoneUrl": "https://www.hk01.com/channel/445/%E5%AF%A6%E7%94%A8%E6%95%99%E5%AD%B8"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '391-數碼生活', '數碼生活', 63, true, '{"zoneId": "391", "zoneUrl": "https://www.hk01.com/channel/391/%E6%95%B8%E7%A2%BC%E7%94%9F%E6%B4%BB"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '390-遊戲動漫', '遊戲動漫', 62, true, '{"zoneId": "390", "zoneUrl": "https://www.hk01.com/channel/390/%E9%81%8A%E6%88%B2%E5%8B%95%E6%BC%AB"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '479-網科3.0', '網科3.0', 61, true, '{"zoneId": "479", "zoneUrl": "https://www.hk01.com/channel/479/%E7%B6%B2%E7%A7%913-0"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '13-攝影專區', '攝影專區', 60, true, '{"zoneId": "13", "zoneUrl": "https://www.hk01.com/zone/13/%E5%BD%B1%E5%83%8F"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '3-體育', '體育', 59, true, '{"zoneId": "3", "zoneUrl": "https://www.hk01.com/zone/3/%E9%AB%94%E8%82%B2"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '20-即時體育', '即時體育', 58, true, '{"zoneId": "20", "zoneUrl": "https://www.hk01.com/channel/20/%E5%8D%B3%E6%99%82%E9%AB%94%E8%82%B2"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '30-跑步行山', '跑步行山', 57, true, '{"zoneId": "30", "zoneUrl": "https://www.hk01.com/channel/30/%E8%B7%91%E6%AD%A5"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '184-Jumper', 'Jumper', 56, true, '{"zoneId": "184", "zoneUrl": "https://www.hk01.com/channel/184/Jumper"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '166-武備志', '武備志', 55, true, '{"zoneId": "166", "zoneUrl": "https://www.hk01.com/channel/166/%E6%AD%A6%E5%82%99%E5%BF%97"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '256-動感影像', '動感影像', 54, true, '{"zoneId": "256", "zoneUrl": "https://www.hk01.com/channel/256/%E5%8B%95%E6%84%9F"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '25-01深圳', '01深圳', 53, true, '{"zoneId": "25", "zoneUrl": "https://www.hk01.com/zone/25/01%E6%B7%B1%E5%9C%B3"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '483-深圳好去處', '深圳好去處', 52, true, '{"zoneId": "483", "zoneUrl": "https://www.hk01.com/channel/483/%E6%B7%B1%E5%9C%B3%E5%A5%BD%E5%8E%BB%E8%99%95"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '482-深圳新聞', '深圳新聞', 51, true, '{"zoneId": "482", "zoneUrl": "https://www.hk01.com/channel/482/%E6%B7%B1%E5%9C%B3%E6%96%B0%E8%81%9E"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '485-深港發展', '深港發展', 100, true, '{"zoneId": "485", "zoneUrl": "https://www.hk01.com/channel/485/%E6%B7%B1%E6%B8%AF%E7%99%BC%E5%B1%95"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '484-人物專題', '人物專題', 99, true, '{"zoneId": "484", "zoneUrl": "https://www.hk01.com/channel/484/%E4%BA%BA%E7%89%A9%E5%B0%88%E9%A1%8C"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '14-經濟', '經濟', 98, true, '{"zoneId": "14", "zoneUrl": "https://www.hk01.com/zone/14/%E7%B6%93%E6%BF%9F"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '396-財經快訊', '財經快訊', 97, true, '{"zoneId": "396", "zoneUrl": "https://www.hk01.com/channel/396/%E8%B2%A1%E7%B6%93%E5%BF%AB%E8%A8%8A"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '487-投資理財', '投資理財', 96, true, '{"zoneId": "487", "zoneUrl": "https://www.hk01.com/channel/487/%E6%8A%95%E8%B3%87%E7%90%86%E8%B2%A1"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '399-地產樓市', '地產樓市', 95, true, '{"zoneId": "399", "zoneUrl": "https://www.hk01.com/channel/399/%E5%9C%B0%E7%94%A2%E6%A8%93%E5%B8%82"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '400-專題人訪', '專題人訪', 94, true, '{"zoneId": "400", "zoneUrl": "https://www.hk01.com/channel/400/%E5%B0%88%E9%A1%8C%E4%BA%BA%E8%A8%AA"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '12-觀點', '觀點', 93, true, '{"zoneId": "12", "zoneUrl": "https://www.hk01.com/zone/12/%E8%A7%80%E9%BB%9E"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '449-社論', '社論', 92, true, '{"zoneId": "449", "zoneUrl": "https://www.hk01.com/channel/449/%E7%A4%BE%E8%AB%96"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '12-全部', '全部', 91, true, '{"zoneId": "12", "zoneUrl": "https://www.hk01.com/zone/12/%E5%85%A8%E9%83%A8"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '50-01觀點', '01觀點', 90, true, '{"zoneId": "50", "zoneUrl": "https://www.hk01.com/channel/50/01%E8%A7%80%E9%BB%9E"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '415-01論壇', '01論壇', 89, true, '{"zoneId": "415", "zoneUrl": "https://www.hk01.com/channel/415/01%E8%AB%96%E5%A3%87"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '480-01專欄', '01專欄', 88, true, '{"zoneId": "480", "zoneUrl": "https://www.hk01.com/channel/480/01%E5%B0%88%E6%AC%84"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '24-健康', '健康', 87, true, '{"zoneId": "24", "zoneUrl": "https://www.hk01.com/zone/24/%E5%81%A5%E5%BA%B7"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '444-健康Easy', '健康Easy', 86, true, '{"zoneId": "444", "zoneUrl": "https://www.hk01.com/channel/444/%E5%81%A5%E5%BA%B7Easy"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '463-醫師Easy', '醫師Easy', 85, true, '{"zoneId": "463", "zoneUrl": "https://www.hk01.com/channel/463/%E9%86%AB%E5%B8%ABEasy"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '464-醫美Easy', '醫美Easy', 84, true, '{"zoneId": "464", "zoneUrl": "https://www.hk01.com/channel/464/%E9%86%AB%E7%BE%8EEasy"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '19-好食玩飛', '好食玩飛', 83, true, '{"zoneId": "19", "zoneUrl": "https://www.hk01.com/zone/19/%E5%A5%BD%E9%A3%9F%E7%8E%A9%E9%A3%9B"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '446-食玩買', '食玩買', 82, true, '{"zoneId": "446", "zoneUrl": "https://www.hk01.com/channel/446/%E9%A3%9F%E7%8E%A9%E8%B2%B7"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '411-旅遊', '旅遊', 81, true, '{"zoneId": "411", "zoneUrl": "https://www.hk01.com/channel/411/%E6%97%85%E9%81%8A"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '178-活動好去處', '活動好去處', 80, true, '{"zoneId": "178", "zoneUrl": "https://www.hk01.com/channel/178/01%E6%B4%BB%E5%8B%95"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '6-女生', '女生', 79, true, '{"zoneId": "6", "zoneUrl": "https://www.hk01.com/zone/6/%E5%A5%B3%E7%94%9F"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '387-穿搭筆記', '穿搭筆記', 78, true, '{"zoneId": "387", "zoneUrl": "https://www.hk01.com/channel/387/%E7%A9%BF%E6%90%AD%E7%AD%86%E8%A8%98"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '443-美容手帳', '美容手帳', 77, true, '{"zoneId": "443", "zoneUrl": "https://www.hk01.com/channel/443/%E7%BE%8E%E5%AE%B9%E6%89%8B%E5%B8%B3"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '388-知性女生', '知性女生', 76, true, '{"zoneId": "388", "zoneUrl": "https://www.hk01.com/channel/388/%E7%9F%A5%E6%80%A7%E5%A5%B3%E7%94%9F"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '389-談情說性', '談情說性', 75, true, '{"zoneId": "389", "zoneUrl": "https://www.hk01.com/channel/389/%E8%AB%87%E6%83%85%E8%AA%AA%E6%80%A7"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '7-熱話', '熱話', 74, true, '{"zoneId": "7", "zoneUrl": "https://www.hk01.com/zone/7/%E7%86%B1%E8%A9%B1"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '7-熱爆話題', '熱爆話題', 73, true, '{"zoneId": "7", "zoneUrl": "https://www.hk01.com/channel/7/%E7%86%B1%E7%88%86%E8%A9%B1%E9%A1%8C"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '317-開罐', '開罐', 72, true, '{"zoneId": "317", "zoneUrl": "https://www.hk01.com/channel/317/%E9%96%8B%E7%BD%90"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '489-人氣話題', '人氣話題', 71, true, '{"zoneId": "489", "zoneUrl": "https://www.hk01.com/channel/489/%E4%BA%BA%E6%B0%A3%E8%A9%B1%E9%A1%8C"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '260-影像熱話', '影像熱話', 70, true, '{"zoneId": "260", "zoneUrl": "https://www.hk01.com/channel/260/%E5%BD%B1%E5%83%8F%E7%86%B1%E8%A9%B1"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '9-藝文格物', '藝文格物', 69, true, '{"zoneId": "9", "zoneUrl": "https://www.hk01.com/zone/9/%E8%97%9D%E6%96%87%E6%A0%BC%E7%89%A9"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '182-一物', '一物', 68, true, '{"zoneId": "182", "zoneUrl": "https://www.hk01.com/channel/182/%E4%B8%80%E7%89%A9"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '206-藝文', '藝文', 67, true, '{"zoneId": "206", "zoneUrl": "https://www.hk01.com/channel/206/%E8%97%9D%E6%96%87"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '348-攝影界', '攝影界', 66, true, '{"zoneId": "348", "zoneUrl": "https://www.hk01.com/channel/348/%E6%94%9D%E5%BD%B1%E7%95%8C"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '10-社區', '社區', 65, true, '{"zoneId": "10", "zoneUrl": "https://www.hk01.com/zone/10/%E7%A4%BE%E5%8D%80"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '23-社區專題', '社區專題', 64, true, '{"zoneId": "23", "zoneUrl": "https://www.hk01.com/channel/23/%E7%A4%BE%E5%8D%80%E5%B0%88%E9%A1%8C"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '422-18區新聞', '18區新聞', 63, true, '{"zoneId": "422", "zoneUrl": "https://www.hk01.com/channel/422/18%E5%8D%80%E6%96%B0%E8%81%9E"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '293-隱形香港', '隱形香港', 62, true, '{"zoneId": "293", "zoneUrl": "https://www.hk01.com/channel/293/%E9%9A%B1%E5%BD%A2%E9%A6%99%E6%B8%AF"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '468-中小學校園', '中小學校園', 61, true, '{"zoneId": "468", "zoneUrl": "https://www.hk01.com/channel/468/%E4%B8%AD%E5%B0%8F%E5%AD%B8%E6%A0%A1%E5%9C%92"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '474-教育發展', '教育發展', 60, true, '{"zoneId": "474", "zoneUrl": "https://www.hk01.com/channel/474/%E6%95%99%E8%82%B2%E7%99%BC%E5%B1%95"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '473-DSE專區', 'DSE專區', 59, true, '{"zoneId": "473", "zoneUrl": "https://www.hk01.com/channel/473/DSE%E5%B0%88%E5%8D%80"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '469-專上教育', '專上教育', 58, true, '{"zoneId": "469", "zoneUrl": "https://www.hk01.com/channel/469/%E5%B0%88%E4%B8%8A%E6%95%99%E8%82%B2"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '475-海外升學', '海外升學', 57, true, '{"zoneId": "475", "zoneUrl": "https://www.hk01.com/channel/475/%E6%B5%B7%E5%A4%96%E5%8D%87%E5%AD%B8"}');

INSERT INTO scraper_categories (source_id, slug, name, priority, is_enabled, metadata)
VALUES ((SELECT id FROM news_sources WHERE source_key = 'hk01'), '476-深造進修', '深造進修', 56, true, '{"zoneId": "476", "zoneUrl": "https://www.hk01.com/channel/476/%E6%B7%B1%E9%80%A0%E9%80%B2%E4%BF%AE"}');

-- ============================================================================
-- END OF INSERT STATEMENTS
-- ============================================================================
-- Total: 94 categories inserted with metadata
-- ============================================================================
