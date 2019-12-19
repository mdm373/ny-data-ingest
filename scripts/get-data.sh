if [ ! -d ".dat" ]; then
    mkdir  .dat
fi
sh ./scripts/download-from.sh nypd-complaint-historical qgea-i56i
sh ./scripts/download-from.sh  nypd-complaint-ytd 5uac-w243
sh ./scripts/download-from.sh  nypd-sectors 5rqd-h5ci
sh ./scripts/download-from.sh  community-districts jp9i-3b7y


