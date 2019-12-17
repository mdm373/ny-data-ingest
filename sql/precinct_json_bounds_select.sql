SELECT precinct, ST_AsGeoJSON(ST_ExteriorRing(final_q.geom_part)) as bounds FROM (
	SELECT	geomType, precinct, ST_SIMPLIFY((dumped.geom_dump).geom, 0.0001) as geom_part FROM (
    	SELECT geomType, precinct, ST_Dump(uniongeom) AS geom_dump FROM t_unioned WHERE geomType='ST_MultiPolygon'
	) as dumped
	UNION
	SELECT geomType, precinct, unionGeom as geom_part FROM t_unioned WHERE geomType='ST_Polygon'
) as final_q WHERE final_q.geom_part IS NOT NULL ORDER BY precinct 

