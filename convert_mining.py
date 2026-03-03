import geopandas as gpd
import json

def convert_to_geojson(shp_path, output_path):
    """使用 geopandas 转换 Shapefile 为 GeoJSON"""
    print(f"正在读取: {shp_path}")
    try:
        gdf = gpd.read_file(shp_path, encoding='utf-8')
        print(f"  → 读取到 {len(gdf)} 个要素")
        
        # 转换为 GeoJSON
        geojson = json.loads(gdf.to_json())
        
        # 保存
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(geojson, f, ensure_ascii=False, indent=2)
        
        print(f"  → 已保存到: {output_path}")
        return geojson
    except Exception as e:
        print(f"  ✗ 错误: {e}")
        return None

base_dir = "public/data/mining"
print("="*50)
print("开始转换非洲矿产数据")
print("="*50)

# 转换矿产设施
print("\n1. 矿产设施")
facilities = convert_to_geojson(
    f"{base_dir}/AFR_Mineral_Facilities.shp",
    f"{base_dir}/AFR_Mineral_Facilities.geojson"
)

# 转换勘探区
print("\n2. 勘探区")
explorations = convert_to_geojson(
    f"{base_dir}/AFR_Mineral_Exploration.shp",
    f"{base_dir}/AFR_Mineral_Exploration.geojson"
)

# 转换矿床
print("\n3. 矿床")
deposits = convert_to_geojson(
    f"{base_dir}/AFR_Mineral_Deposits.shp",
    f"{base_dir}/AFR_Mineral_Deposits.geojson"
)

print("\n" + "="*50)
print("转换完成！")
print(f"设施数: {len(facilities['features']) if facilities else 0}")
print(f"勘探区数: {len(explorations['features']) if explorations else 0}")
print(f"矿床数: {len(deposits['features']) if deposits else 0}")
print("="*50)
