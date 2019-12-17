CREATE TEMP TABLE t_unioned AS (
	SELECT *, ST_GeometryType(q_unioned.unionGeom) AS geomType FROM (
		SELECT pct AS precinct, ST_Union(array_agg(the_geom)) AS unionGeom FROM nypd_sectors GROUP BY pct ORDER BY precinct
	) AS q_unioned
);