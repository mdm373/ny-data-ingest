SELECT * from (
	SELECT	bound_id, st_asgeojson(st_centroid(geom_part)) as centroid, st_asgeojson(st_exteriorring(st_simplify(geom_part, {{tolerance}}))) as bounds FROM (
		SELECT (geom_dump).geom as geom_part, bound_id FROM (
			SELECT st_dump(geom_part) as geom_dump, bound_id FROM (
				SELECT * from(
					SELECT *, st_geometrytype(geom_part) AS geom_type FROM (SELECT st_geomfromtext({{geomKey}}) AS geom_part, {{boundKey}} AS bound_id FROM {{boundSource}}) AS geom_select
				) typed_select WHERE geom_type = 'ST_MultiPolygon'
			) AS dumped_multi
		) as multi_select
		UNION
		SELECT geom_part, bound_id FROM (
			SELECT *, st_geometrytype(geom_part) AS geom_type FROM (SELECT st_geomfromtext({{geomKey}}) AS geom_part, {{boundKey}} AS bound_id FROM {{boundSource}}) AS geom_select
		) typed_select WHERE geom_type = 'ST_Polygon'
	) as select_json
) as clean_select WHERE bounds IS NOT NULL ORDER BY bound_id

