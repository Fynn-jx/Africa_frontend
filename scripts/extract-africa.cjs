// 提取非洲国家数据的脚本
const fs = require('fs');
const path = require('path');

// 所有54个非洲国家的ISO代码
const africanCountries = [
  'DZ', // Algeria 阿尔及利亚
  'AO', // Angola 安哥拉
  'BJ', // Benin 贝宁
  'BW', // Botswana 博茨瓦纳
  'BF', // Burkina Faso 布基纳法索
  'BI', // Burundi 布隆迪
  'CV', // Cabo Verde 佛得角
  'CM', // Cameroon 喀麦隆
  'CF', // Central African Republic 中非共和国
  'TD', // Chad 乍得
  'KM', // Comoros 科摩罗
  'CG', // Congo 刚果（布）
  'CI', // Cote d'Ivoire 科特迪瓦
  'CD', // Democratic Republic of the Congo 刚果（金）
  'DJ', // Djibouti 吉布提
  'EG', // Egypt 埃及
  'GQ', // Equatorial Guinea 赤道几内亚
  'ER', // Eritrea 厄立特里亚
  'SZ', // Eswatini 斯威士兰
  'ET', // Ethiopia 埃塞俄比亚
  'GA', // Gabon 加蓬
  'GM', // Gambia 冈比亚
  'GH', // Ghana 加纳
  'GN', // Guinea 几内亚
  'GW', // Guinea-Bissau 几内亚比绍
  'KE', // Kenya 肯尼亚
  'LS', // Lesotho 莱索托
  'LR', // Liberia 利比里亚
  'LY', // Libya 利比亚
  'MG', // Madagascar 马达加斯加
  'MW', // Malawi 马拉维
  'ML', // Mali 马里
  'MR', // Mauritania 毛里塔尼亚
  'MU', // Mauritius 毛里求斯
  'MA', // Morocco 摩洛哥
  'MZ', // Mozambique 莫桑比克
  'NA', // Namibia 纳米比亚
  'NE', // Niger 尼日尔
  'NG', // Nigeria 尼日利亚
  'RW', // Rwanda 卢旺达
  'ST', // Sao Tome and Principe 圣多美和普林西比
  'SN', // Senegal 塞内加尔
  'SC', // Seychelles 塞舌尔
  'SL', // Sierra Leone 塞拉利昂
  'SO', // Somalia 索马里
  'ZA', // South Africa 南非
  'SS', // South Sudan 南苏丹
  'SD', // Sudan 苏丹
  'TZ', // Tanzania 坦桑尼亚
  'TG', // Togo 多哥
  'TN', // Tunisia 突尼斯
  'UG', // Uganda 乌干达
  'ZM', // Zambia 赞比亚
  'ZW', // Zimbabwe 津巴布韦
];

// 读取下载的全球国家数据
const inputFile = path.join(__dirname, '../public/data/africa-countries.geojson');
const outputFile = path.join(__dirname, '../public/data/african-countries-only.geojson');

try {
  console.log('正在读取全球国家数据...');
  const worldData = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

  console.log(`总共有 ${worldData.features.length} 个国家`);

  // 过滤非洲国家
  const africanFeatures = worldData.features.filter(feature => {
    const props = feature.properties || {};
    const isoCode = props['ISO3166-1-Alpha-2'] || props.iso_a2 || props.ISO_A2 || props.code;
    return africanCountries.includes(isoCode);
  });

  console.log(`找到 ${africanFeatures.length} 个非洲国家`);

  // 创建新的 GeoJSON 对象
  const africaData = {
    type: "FeatureCollection",
    features: africanFeatures
  };

  // 写入文件
  fs.writeFileSync(outputFile, JSON.stringify(africaData, null, 2));
  console.log(`非洲国家数据已保存到: ${outputFile}`);

  // 打印找到的国家列表
  console.log('\n非洲国家列表:');
  africanFeatures.forEach(f => {
    const name = f.properties?.name || f.properties?.NAME || f.properties?.admin;
    const iso = f.properties?.iso_a2 || f.properties?.ISO_A2 || f.properties?.code;
    console.log(`  - ${name} (${iso})`);
  });

} catch (error) {
  console.error('错误:', error.message);
}
