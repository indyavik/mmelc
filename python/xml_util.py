__author__ = 'EduardoFernandes'

import xml.etree.cElementTree as ET
from xml.dom import minidom
import os

def create_xml(root):
    root = ET.Element(root)
    return root

def saveConfig(root,port,ip,imgF,imgP,scanP):
    config = ET.SubElement(root, "Config")
    ET.SubElement(config, "ServerPort").text = port
    ET.SubElement(config, "ServerIP").text = ip
    ET.SubElement(config, "IServeLocation").text = imgF

    ET.SubElement(config, "Default_ImagePath").text = imgP
    ET.SubElement(config, "Scan_ImagePath").text = scanP

    return root

def loadXML(path):

    if os.path.isfile(path) :
        return minidom.parse(path)
    else:
        root = create_xml("PathXL")
        saveConfig(root,"8080","localhost","iserve","G:\\","images.location")
        save_xml(root,path)
        return minidom.parse(path)

def getXMLValue(xml,id):
    tree = xml.getElementsByTagName(id)

    if len(tree) != 1:
        return ""

    return tree[0].firstChild.nodeValue


def save_xml(root, path,file):

    if not os.path.exists(path):
        os.makedirs(path)

    output_file = open(path + "\\"+ file, 'w')
    output_file.write(prettify(root))
    output_file.close()


def prettify(elem):
    rough_string = ET.tostring(elem, 'utf-8')
    reparsed = minidom.parseString(rough_string)
    return reparsed.toprettyxml(indent="  ")
