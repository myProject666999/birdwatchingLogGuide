SET NAMES utf8mb4;
CREATE DATABASE IF NOT EXISTS birdwatching DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE birdwatching;

DROP TABLE IF EXISTS activity_participants;
DROP TABLE IF EXISTS activities;
DROP TABLE IF EXISTS user_achievements;
DROP TABLE IF EXISTS achievements;
DROP TABLE IF EXISTS observations;
DROP TABLE IF EXISTS life_lists;
DROP TABLE IF EXISTS bird_species;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nickname VARCHAR(50),
    avatar VARCHAR(255),
    bio TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE bird_species (
    id INT AUTO_INCREMENT PRIMARY KEY,
    chinese_name VARCHAR(100) NOT NULL,
    latin_name VARCHAR(150) NOT NULL,
    english_name VARCHAR(150),
    bird_order VARCHAR(50) NOT NULL,
    family VARCHAR(50) NOT NULL,
    genus VARCHAR(50),
    features TEXT,
    distribution TEXT,
    habitat TEXT,
    conservation_status VARCHAR(20),
    bird_call_audio VARCHAR(255),
    image_url VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_order (bird_order),
    INDEX idx_family (family),
    INDEX idx_chinese_name (chinese_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE life_lists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    species_id INT NOT NULL,
    first_observed_date DATE NOT NULL,
    first_observed_location VARCHAR(200),
    first_observation_id INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_species (user_id, species_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (species_id) REFERENCES bird_species(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE observations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    species_id INT NOT NULL,
    observation_date DATE NOT NULL,
    location_name VARCHAR(200) NOT NULL,
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    province VARCHAR(50),
    city VARCHAR(50),
    district VARCHAR(50),
    count INT NOT NULL DEFAULT 1,
    behavior ENUM('取食', '求偶', '筑巢', '育雏', '迁徙', '休息', '鸣叫', '其他') DEFAULT '其他',
    weather VARCHAR(50),
    notes TEXT,
    photos JSON,
    audio VARCHAR(255),
    video VARCHAR(255),
    is_public BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (species_id) REFERENCES bird_species(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_species (species_id),
    INDEX idx_date (observation_date),
    INDEX idx_location (province, city)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE achievements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(100),
    type ENUM('species', 'milestone', 'location', 'activity', 'special') NOT NULL,
    condition_type VARCHAR(50) NOT NULL,
    condition_value INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_achievements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    achievement_id INT NOT NULL,
    unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_achievement (user_id, achievement_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    activity_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    location_name VARCHAR(200) NOT NULL,
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    province VARCHAR(50),
    city VARCHAR(50),
    max_participants INT DEFAULT 20,
    difficulty ENUM('入门', '轻松', '中等', '挑战', '专业') DEFAULT '轻松',
    equipment VARCHAR(255),
    notes TEXT,
    status ENUM('招募中', '已满员', '进行中', '已结束', '已取消') DEFAULT '招募中',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_date (activity_date),
    INDEX idx_status (status),
    INDEX idx_location (province, city)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE activity_participants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    activity_id INT NOT NULL,
    user_id INT NOT NULL,
    role ENUM('组织者', '参与者') DEFAULT '参与者',
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status ENUM('已报名', '已确认', '已退出') DEFAULT '已报名',
    UNIQUE KEY uk_activity_user (activity_id, user_id),
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO achievements (name, description, icon, type, condition_type, condition_value) VALUES
('初窥鸟门', '记录你的第一只鸟', '[芽]', 'milestone', 'total_species', 1),
('鸟类新手', '记录10种不同的鸟', '[蛋]', 'milestone', 'total_species', 10),
('观鸟入门', '记录25种不同的鸟', '[鸟]', 'milestone', 'total_species', 25),
('观鸟达人', '记录50种不同的鸟', '[鹰]', 'milestone', 'total_species', 50),
('鸟类专家', '记录100种不同的鸟', '[鸮]', 'milestone', 'total_species', 100),
('鸟类学家', '记录200种不同的鸟', '[杯]', 'milestone', 'total_species', 200),
('坚持不懈', '累计记录50次观察', '[笔]', 'milestone', 'total_observations', 50),
('观察狂人', '累计记录200次观察', '[书]', 'milestone', 'total_observations', 200),
('新年新鸟', '今年新增1种鸟', '[庆]', 'special', 'year_new_species', 1),
('环游中国', '在10个不同城市观鸟', '[图]', 'location', 'unique_cities', 10),
('社交达人', '参加5次观鸟活动', '[人]', 'activity', 'joined_activities', 5),
('活动组织者', '发起3次观鸟活动', '[号]', 'activity', 'organized_activities', 3);

INSERT INTO users (username, email, password, nickname, bio) VALUES
('demo', 'demo@example.com', '$2a$10$5qtzdQ3J85ypCH7LLDaZVOY2y240y1LoY54.l86srq/P7T9.7iXfK', '演示用户', '这是一个演示账户，密码为 demo123');

INSERT INTO bird_species (chinese_name, latin_name, english_name, bird_order, family, genus, features, distribution, habitat, conservation_status, image_url) VALUES
('麻雀', 'Passer montanus', 'Eurasian Tree Sparrow', '雀形目', '雀科', '麻雀属', '体型小巧，体长约14厘米。头顶和后颈栗褐色，背部褐色带黑色纵纹，脸颊有黑斑。', '中国各地广泛分布', '城镇、村落、农田等人类活动区域', '无危', 'https://example.com/sparrow.jpg'),
('白头鹎', 'Pycnonotus sinensis', 'Light-vented Bulbul', '雀形目', '鹎科', '鹎属', '头顶黑色，眼后一白色宽纹延伸至颈背，上体灰褐色，下体白色。', '中国南方地区广泛分布', '树林、灌丛、园林、城市绿地', '无危', 'https://example.com/bulbul.jpg'),
('喜鹊', 'Pica pica', 'Eurasian Magpie', '雀形目', '鸦科', '鹊属', '头、颈、胸和背部黑色，肩和腹部白色，尾长，两翼有蓝色金属光泽。', '中国各地广泛分布', '林缘、农田、城镇村庄', '无危', 'https://example.com/magpie.jpg'),
('珠颈斑鸠', 'Spilopelia chinensis', 'Spotted Dove', '鸽形目', '鸠鸽科', '斑鸠属', '颈侧有黑底白点的珠状颈圈，上体褐色，下体粉褐色，尾端白色。', '中国中部和南方地区', '平原、低山、村落附近', '无危', 'https://example.com/dove.jpg'),
('乌鸫', 'Turdus merula', 'Common Blackbird', '雀形目', '鸫科', '鸫属', '雄鸟全身黑色，喙和眼圈黄色；雌鸟暗褐色。', '中国大部分地区', '林地、园林、农田边缘', '无危', 'https://example.com/blackbird.jpg'),
('家燕', 'Hirundo rustica', 'Barn Swallow', '雀形目', '燕科', '燕属', '上体钢蓝色，额和喉栗红色，胸带不明显，腹部白色，尾深叉形。', '中国各地（夏候鸟）', '村庄、城镇附近，常在屋檐下筑巢', '无危', 'https://example.com/swallow.jpg'),
('白鹭', 'Egretta garzetta', 'Little Egret', '鹈形目', '鹭科', '白鹭属', '全身白色，嘴黑色，脚黑色，趾黄色。繁殖期有冠羽。', '中国东部、南部、西南地区', '湿地、稻田、河滩、沼泽', '无危', 'https://example.com/egret.jpg'),
('夜鹭', 'Nycticorax nycticorax', 'Black-crowned Night Heron', '鹈形目', '鹭科', '夜鹭属', '头顶、背部黑绿色有光泽，颈和胸白色，枕部有2-3根白色饰羽。', '中国大部分地区', '湖泊、河流、稻田、沼泽', '无危', 'https://example.com/night_heron.jpg'),
('小䴙䴘', 'Tachybaptus ruficollis', 'Little Grebe', '䴙䴘目', '䴙䴘科', '小䴙䴘属', '体型小，繁殖期前颈和栗红色，嘴黑色；非繁殖期体色较暗。', '中国大部分地区', '湖泊、池塘、河流', '无危', 'https://example.com/grebe.jpg'),
('黑水鸡', 'Gallinula chloropus', 'Common Moorhen', '鹤形目', '秧鸡科', '水鸡属', '通体黑灰色，嘴红色尖端黄色，额甲红色，腿和脚黄绿色。', '中国大部分地区', '湖泊、池塘、沼泽、稻田', '无危', 'https://example.com/moorhen.jpg'),
('普通翠鸟', 'Alcedo atthis', 'Common Kingfisher', '佛法僧目', '翠鸟科', '翠鸟属', '上体金属蓝绿色，耳区皮黄色，下体栗棕色，喙长而尖。', '中国大部分地区', '河流、湖泊、池塘岸边', '无危', 'https://example.com/kingfisher.jpg'),
('戴胜', 'Upupa epops', 'Eurasian Hoopoe', '犀鸟目', '戴胜科', '戴胜属', '头有粉棕色扇状冠羽，嘴细长下弯，体羽土黄色，翅和尾有黑白相间条纹。', '中国大部分地区', '开阔农田、园林、村庄', '无危', 'https://example.com/hoopoe.jpg'),
('大斑啄木鸟', 'Dendrocopos major', 'Great Spotted Woodpecker', '啄木鸟目', '啄木鸟科', '啄木鸟属', '雄鸟头顶红色，上体黑色，肩和翅有白色斑块，下体淡褐色。', '中国大部分地区', '森林、园林、果园', '无危', 'https://example.com/woodpecker.jpg'),
('红嘴蓝鹊', 'Urocissa erythroryncha', 'Red-billed Blue Magpie', '雀形目', '鸦科', '蓝鹊属', '头、颈、胸黑色，嘴红色，背部紫蓝色，尾长有黑白横纹，腹部白色。', '中国东部、南部、西南地区', '森林、林缘、园林', '无危', 'https://example.com/blue_magpie.jpg'),
('暗绿绣眼鸟', 'Zosterops japonicus', 'Warbling White-eye', '雀形目', '绣眼鸟科', '绣眼鸟属', '通体橄榄绿色，眼周有白色眼圈，喉和尾下覆羽柠檬黄色。', '中国东部、南部地区', '树林、灌丛、园林', '无危', 'https://example.com/white_eye.jpg'),
('画眉', 'Garrulax canorus', 'Chinese Hwamei', '雀形目', '噪鹛科', '噪鹛属', '上体棕褐色，眼周有白色眉纹，下体棕黄色，腹部中央灰色。鸣声婉转。', '中国南方地区', '灌丛、竹林、园林', '无危', 'https://example.com/hwamei.jpg'),
('八哥', 'Acridotheres cristatellus', 'Crested Myna', '雀形目', '椋鸟科', '八哥属', '通体黑色，前额有冠状羽簇，翅有白色翅斑，嘴乳黄色，脚黄色。', '中国南方地区', '村落、农田、城市', '无危', 'https://example.com/myna.jpg'),
('鸳鸯', 'Aix galericulata', 'Mandarin Duck', '雁形目', '鸭科', '鸳鸯属', '雄鸟羽色艳丽，有彩色羽冠，眼后白色眉纹；雌鸟灰褐色，眼周白色。', '中国东部、东北部', '湖泊、河流、池塘', '无危', 'https://example.com/mandarin_duck.jpg'),
('绿头鸭', 'Anas platyrhynchos', 'Mallard', '雁形目', '鸭科', '鸭属', '雄鸟头和颈绿色具金属光泽，颈有白色领环；雌鸟通体黄褐色。', '中国各地', '湖泊、河流、水库', '无危', 'https://example.com/mallard.jpg'),
('普通鸬鹚', 'Phalacrocorax carbo', 'Great Cormorant', '鲣鸟目', '鸬鹚科', '鸬鹚属', '通体黑色，头颈有紫绿色光泽，颊和喉白色，繁殖期头顶有冠羽。', '中国大部分地区', '河流、湖泊、沿海', '无危', 'https://example.com/cormorant.jpg'),
('苍鹰', 'Accipiter gentilis', 'Northern Goshawk', '鹰形目', '鹰科', '鹰属', '中型猛禽，上体深苍灰色，下体灰白色具深色横纹，尾有4-5条暗色横带。', '中国大部分地区', '森林、林缘', '国家二级保护', 'https://example.com/goshawk.jpg'),
('红隼', 'Falco tinnunculus', 'Common Kestrel', '隼形目', '隼科', '隼属', '小型猛禽，雄鸟头顶及颈背灰色，背砖红色具黑斑；雌鸟上体褐色。', '中国各地', '开阔地带、农田、林缘', '国家二级保护', 'https://example.com/kestrel.jpg'),
('鸿雁', 'Anser cygnoides', 'Swan Goose', '雁形目', '鸭科', '雁属', '大型雁类，上体灰褐色，头顶后颈暗褐色，前颈近白色，嘴黑色。', '中国东北繁殖，长江中下游越冬', '湖泊、河流、沼泽', '国家二级保护', 'https://example.com/swan_goose.jpg'),
('小天鹅', 'Cygnus columbianus', 'Tundra Swan', '雁形目', '鸭科', '天鹅属', '全身白色，嘴黑色，嘴基黄色不延伸至鼻孔下，颈部比大天鹅略短。', '中国长江中下游越冬', '湖泊、水库、沼泽', '国家二级保护', 'https://example.com/tundra_swan.jpg'),
('丹顶鹤', 'Grus japonensis', 'Red-crowned Crane', '鹤形目', '鹤科', '鹤属', '大型涉禽，全身白色，头顶鲜红色，喉和颈黑色，次级飞羽和三级飞羽黑色。', '中国东北繁殖，江苏沿海越冬', '湿地、沼泽、滩涂', '国家一级保护', 'https://example.com/red_crowned_crane.jpg');
