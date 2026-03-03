import geopandas as gpd
import json
import os

def convert_to_geojson(shp_path, output_path):
    """使用 geopandas 转换 Shapefile 为 GeoJSON"""
    print(f"正在读取: {shp_path}")
    try:
        gdf = gpd.read_file(shp_path, encoding='utf-8')
        print(f"  → 读取到 {len(gdf)} 个要素")
        print(f"  → 列: {list(gdf.columns)}")
        
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

base_dir = "public/tazara-data"
print("="*50)
print("开始转换坦赞铁路数据")
print("="*50)

# 转换坦桑尼亚段铁路
print("\n1. 坦桑尼亚段铁路")
tanzania_rail = convert_to_geojson(
    f"{base_dir}/坦桑尼亚段铁路.shp",
    f"{base_dir}/tanzania_rail.geojson"
)

# 转换坦桑尼亚段站点
print("\n2. 坦桑尼亚段站点")
tanzania_stations = convert_to_geojson(
    f"{base_dir}/坦桑尼亚段铁路站点.shp",
    f"{base_dir}/tanzania_stations.geojson"
)

# 转换赞比亚段铁路
print("\n3. 赞比亚段铁路")
zambia_rail = convert_to_geojson(
    f"{base_dir}/赞比亚段铁路.shp",
    f"{base_dir}/zambia_rail.geojson"
)

# 转换赞比亚段站点
print("\n4. 赞比亚段站点")
zambia_stations = convert_to_geojson(
    f"{base_dir}/赞比亚段铁路站点.shp",
    f"{base_dir}/zambia_stations.geojson"
)

print("\n" + "="*50)
print("转换完成！")
print(f"坦桑尼亚站点数: {len(tanzania_stations['features']) if tanzania_stations else 0}")
print(f"赞比亚站点数: {len(zambia_stations['features']) if zambia_stations else 0}")
print("="*50)
