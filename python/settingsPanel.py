__author__ = 'EduardoFernandes'

import os

import wx
import wx.xrc
import wx.lib.agw.aui as wxaui

import xml_util



class settingsPanel(wx.Dialog):
    def __init__(self, parent, location,xml):
        wx.Dialog.__init__(self, parent, id=wx.ID_ANY, title=u"Server Settings", pos=wx.DefaultPosition,
                           size=wx.Size(300, 300), style=wx.DEFAULT_DIALOG_STYLE)

        self.parent = parent
        self.SetSizeHintsSz(wx.DefaultSize, wx.DefaultSize)
        self.m_mgr = wxaui.AuiManager()
        self.m_mgr.SetManagedWindow(self)
        self.m_mgr.SetAGWFlags(wxaui.AUI_MGR_DEFAULT | wxaui.AUI_MGR_LIVE_RESIZE)

        # Load Config
        self.loc = location
        img_ip,img_port = self.readConfig(location + "nginx-1.8.0\\conf\\nginx.conf")

        self.portLB = wx.StaticText(self, wx.ID_ANY, u"Server Port :", wx.DefaultPosition, wx.DefaultSize)
        self.ipLB = wx.StaticText(self, wx.ID_ANY, u"Server IP :", wx.DefaultPosition, wx.DefaultSize)

        self.iservIPLB = wx.StaticText(self, wx.ID_ANY, u"Image Server IP:", wx.DefaultPosition, wx.DefaultSize)
        self.iservPORTLB = wx.StaticText(self, wx.ID_ANY, u"Image Server Port:", wx.DefaultPosition, wx.DefaultSize)

        self.imgPathLB = wx.StaticText(self, wx.ID_ANY, u"Default Images Drive :", wx.DefaultPosition, wx.DefaultSize)
        self.imgPathSCANLB = wx.StaticText(self, wx.ID_ANY, u"Location File Name :", wx.DefaultPosition, wx.DefaultSize)

        self.portTC = wx.TextCtrl(self, wx.ID_ANY, xml_util.getXMLValue(xml,"ServerPort"), wx.DefaultPosition, wx.DefaultSize,wx.TE_WORDWRAP)
        self.ipTC = wx.TextCtrl(self, wx.ID_ANY, xml_util.getXMLValue(xml,"ServerIP"), wx.DefaultPosition, wx.DefaultSize,wx.TE_WORDWRAP)

        self.iservIPTC = wx.TextCtrl(self, wx.ID_ANY, img_ip, wx.DefaultPosition, wx.DefaultSize,wx.TE_WORDWRAP)
        self.iservPORTTC = wx.TextCtrl(self, wx.ID_ANY, img_port, wx.DefaultPosition, wx.DefaultSize,wx.TE_WORDWRAP)

        self.imgPathTC = wx.TextCtrl(self, wx.ID_ANY, xml_util.getXMLValue(xml,"Default_ImagePath"), wx.DefaultPosition, wx.DefaultSize,wx.TE_WORDWRAP)
        self.imgPathSCANTC = wx.TextCtrl(self, wx.ID_ANY, xml_util.getXMLValue(xml,"Scan_ImagePath"), wx.DefaultPosition, wx.DefaultSize,wx.TE_WORDWRAP)

        self.okButton = wx.Button(self, wx.ID_ANY, u"Apply", wx.DefaultPosition, wx.DefaultSize)
        self.cancelButton = wx.Button(self, wx.ID_ANY, u"Cancel", wx.DefaultPosition, wx.DefaultSize)


        self.okButton.Bind(wx.EVT_BUTTON, self.applyButton)
        self.cancelButton.Bind(wx.EVT_BUTTON, self.onClose)

        # ----------------------- #

        panel = wxaui.AuiPaneInfo().Top()
        panel.CaptionVisible(False)
        panel.CloseButton(False)
        panel.FloatingSize(wx.DefaultSize)
        panel.DockFixed(False)
        panel.Floatable(False)
        panel.Resizable()
        panel.Layer(1)
        panel.Dock()

        self.m_mgr.AddPane(self.portTC, panel)

        panel = wxaui.AuiPaneInfo().Top()
        panel.CaptionVisible(False)
        panel.CloseButton(False)
        panel.FloatingSize(wx.DefaultSize)
        panel.DockFixed(False)
        panel.Floatable(False)
        panel.Resizable()
        panel.Layer(2)
        panel.Dock()

        self.m_mgr.AddPane(self.portLB, panel)

        # ----------------------- #

        panel = wxaui.AuiPaneInfo().Top()
        panel.CaptionVisible(False)
        panel.CloseButton(False)
        panel.FloatingSize(wx.DefaultSize)
        panel.DockFixed(False)
        panel.Floatable(False)
        panel.Resizable()
        panel.Layer(1)
        panel.Dock()

        self.m_mgr.AddPane(self.ipTC, panel)

        panel = wxaui.AuiPaneInfo().Top()
        panel.CaptionVisible(False)
        panel.CloseButton(False)
        panel.FloatingSize(wx.DefaultSize)
        panel.DockFixed(False)
        panel.Floatable(False)
        panel.Resizable()
        panel.Layer(2)
        panel.Dock()

        self.m_mgr.AddPane(self.ipLB, panel)


        # ----------------------- #

        panel = wxaui.AuiPaneInfo().Top()
        panel.CaptionVisible(False)
        panel.CloseButton(False)
        panel.FloatingSize(wx.DefaultSize)
        panel.DockFixed(False)
        panel.Floatable(False)
        panel.Resizable()
        panel.Layer(3)
        panel.Dock()

        self.m_mgr.AddPane(self.iservIPTC, panel)

        panel = wxaui.AuiPaneInfo().Top()
        panel.CaptionVisible(False)
        panel.CloseButton(False)
        panel.FloatingSize(wx.DefaultSize)
        panel.DockFixed(False)
        panel.Floatable(False)
        panel.Resizable()
        panel.Layer(4)
        panel.Dock()

        self.m_mgr.AddPane(self.iservIPLB, panel)


        # ----------------------- #

        panel = wxaui.AuiPaneInfo().Top()
        panel.CaptionVisible(False)
        panel.CloseButton(False)
        panel.FloatingSize(wx.DefaultSize)
        panel.DockFixed(False)
        panel.Floatable(False)
        panel.Resizable()
        panel.Layer(3)
        panel.Dock()

        self.m_mgr.AddPane(self.iservPORTTC, panel)

        panel = wxaui.AuiPaneInfo().Top()
        panel.CaptionVisible(False)
        panel.CloseButton(False)
        panel.FloatingSize(wx.DefaultSize)
        panel.DockFixed(False)
        panel.Floatable(False)
        panel.Resizable()
        panel.Layer(4)
        panel.Dock()

        self.m_mgr.AddPane(self.iservPORTLB, panel)

        # ----------------------- #

        panel = wxaui.AuiPaneInfo().Top()
        panel.CaptionVisible(False)
        panel.CloseButton(False)
        panel.FloatingSize(wx.DefaultSize)
        panel.DockFixed(False)
        panel.Floatable(False)
        panel.Resizable()
        panel.Layer(7)
        panel.Dock()

        self.m_mgr.AddPane(self.imgPathTC, panel)

        panel = wxaui.AuiPaneInfo().Top()
        panel.CaptionVisible(False)
        panel.CloseButton(False)
        panel.FloatingSize(wx.DefaultSize)
        panel.DockFixed(False)
        panel.Floatable(False)
        panel.Resizable()
        panel.Layer(8)
        panel.Dock()

        self.m_mgr.AddPane(self.imgPathLB, panel)

        # ----------------------- #

        panel = wxaui.AuiPaneInfo().Top()
        panel.CaptionVisible(False)
        panel.CloseButton(False)
        panel.FloatingSize(wx.DefaultSize)
        panel.DockFixed(False)
        panel.Floatable(False)
        panel.Resizable()
        panel.Layer(9)
        panel.Dock()

        self.m_mgr.AddPane(self.imgPathSCANTC, panel)

        panel = wxaui.AuiPaneInfo().Top()
        panel.CaptionVisible(False)
        panel.CloseButton(False)
        panel.FloatingSize(wx.DefaultSize)
        panel.DockFixed(False)
        panel.Floatable(False)
        panel.Resizable()
        panel.Layer(10)
        panel.Dock()

        self.m_mgr.AddPane(self.imgPathSCANLB, panel)
        # ----------------------- #

        panel = wxaui.AuiPaneInfo().Bottom()
        panel.CaptionVisible(False)
        panel.CloseButton(False)
        panel.FloatingSize(wx.DefaultSize)
        panel.DockFixed(False)
        panel.Floatable(False)
        panel.Resizable()
        panel.Layer(1)
        panel.Dock()

        self.m_mgr.AddPane(self.okButton, panel)

        panel = wxaui.AuiPaneInfo().Bottom()
        panel.CaptionVisible(False)
        panel.CloseButton(False)
        panel.FloatingSize(wx.DefaultSize)
        panel.DockFixed(False)
        panel.Floatable(False)
        panel.Resizable()
        panel.Layer(1)
        panel.Dock()

        self.m_mgr.AddPane(self.cancelButton, panel)
        # ----------------------- #

        self.m_mgr.Update()
        self.Centre(wx.BOTH)
        self.Show()

    def applyButton(self,event):

        xml = xml_util.create_xml("PathXL")
        xml = xml_util.saveConfig(xml,self.portTC.GetValue(),self.ipTC.GetValue(),"iserve",self.imgPathTC.GetValue(),self.imgPathSCANTC.GetValue())
        xml_util.save_xml(xml,self.loc + "nginx-1.8.0\\html\\data","config.xml")

        self.saveConfig(self.loc + "nginx-1.8.0\\conf\\nginx.conf",self.portTC.GetValue(),self.iservIPTC.GetValue(),self.iservPORTTC.GetValue())

        IServeport = open(self.loc + 'iservefcgi\\port.txt', 'w')
        IServeport.write(self.iservPORTTC.GetValue())
        IServeport.close()

        wx.MessageBox('Restart the program to apply the new Settings', 'Warning', wx.OK | wx.ICON_WARNING)
        self.onClose("")

    def saveConfig(self,path,port,imgIP,imgPORT):
        CONF = open(path, 'w')

        NGINXData =  'events {\n'
        NGINXData += '  worker_connections 1024;\n'
        NGINXData += '}\n\n'

        NGINXData +=  'http\n'
        NGINXData +=  '{\n'
        NGINXData +=  '  server\n'
        NGINXData +=  '  {\n'
        NGINXData +=  '    listen       '+port+';\n'
        NGINXData +=  '    server_name localhost;\n'
        NGINXData +=  '    location = /iserve/\n'
        NGINXData +=  '    {\n'
        NGINXData +=  '		fastcgi_param QUERY_STRING $query_string;\n'
        NGINXData +=  '		fastcgi_pass '+imgIP+':'+imgPORT+';\n'
        NGINXData +=  '    }\n'

        NGINXData +=  '	location / {\n'
        NGINXData +=  '		include  mime.types;\n'
        NGINXData +=  '    }\n'
        NGINXData +=  '  }\n'
        NGINXData +=  '}\n'

        CONF.write(NGINXData)
        CONF.close()

    def readConfig(self,path):

        if not os.path.isfile(path) :

            self.saveConfig(path,"8080","iserve","127.0.0.1","82")
            return "127.0.0.1","82"
        else:

            CONF = open(path, 'r')

            if CONF and CONF != "":

                spl = CONF.read().split('\n')
                CONF.close()

                corrF = ""
                for fil in spl :
                    if fil.find("fastcgi_pass") != -1:
                        corrF = fil
                        break

                if corrF != "":
                    corrF = corrF.replace("fastcgi_pass","").replace(";","")
                    corrF = corrF.strip()

                    data = corrF.split(":")
                    if len(data) >= 2 :
                        return data[0],data[1]

            return "127.0.0.1","82"


    def onClose(self,event):
        self.Close()

    def __del__(self):
        self.m_mgr.UnInit()
