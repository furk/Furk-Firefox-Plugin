#!/bin/bash

rm furkuploader.xpi
zip -r furkuploader.xpi chrome/* defaults/* chrome.manifest install.rdf --exclude \*.svn/*
echo 'furkuploader.xpi created'
