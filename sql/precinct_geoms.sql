SELECT pct as precinct, array_agg(the_geom) as geoms, array_agg(sector) as sectors from nypd_sectors GROUP BY pct ORDER BY precinct