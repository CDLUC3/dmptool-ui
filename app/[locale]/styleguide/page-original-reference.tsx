"use client";

import React, { useState } from "react";
import { useRouter } from "@/i18n/routing";
import {
  Button,
  Cell,
  Checkbox,
  CheckboxGroup,
  Column,
  Dialog,
  DialogTrigger,
  FieldError,
  Form,
  Input,
  Label,
  Link,
  ListBox,
  ListBoxItem,
  Menu,
  MenuItem,
  MenuTrigger,
  OverlayArrow,
  Popover,
  Radio,
  RadioGroup,
  Row,
  Select,
  SelectValue,
  Switch,
  Tab,
  Table,
  TableBody,
  TableHeader,
  TabList,
  TabPanel,
  Tabs,
  Text,
  TextField,
} from "react-aria-components";

import { DmpIcon } from "@/components/Icons";
import TinyMCEEditor from "@/components/TinyMCEEditor";

import { Card, CardBody, CardEyebrow, CardFooter, CardHeading, CardMutedText } from "@/components/Card/card";

import {
  ContentContainer,
  DrawerPanel,
  LayoutContainer,
  LayoutWithPanel,
  SidebarPanel,
  ToolbarContainer,
} from "@/components/Container";

import { BrandColor, Example, handleDelete } from "./shared/components";

import TypeAheadInput from "@/components/TypeAheadInput";
import { TypeAheadWithOther, useAffiliationSearch } from "@/components/Form/TypeAheadWithOther";
import { AffiliationSearch, AffiliationSearchResults } from "@/generated/graphql";

import "./shared/styleguide.scss";
import SectionHeaderEdit from "@/components/SectionHeaderEdit";
import QuestionEditCard from "@/components/QuestionEditCard";
import SubHeader from "@/components/SubHeader";
import TooltipWithDialog from "@/components/TooltipWithDialog";
import { ModalOverlayComponent } from "@/components/ModalOverlayComponent";
import ButtonWithImage from "@/components/ButtonWithImage";
import { useToast } from "@/context/ToastContext";

import QuestionPreview from "@/components/QuestionPreview";
import FunderSearch from "@/components/FunderSearch";

function Page() {
  const [otherField, setOtherField] = useState(false);
  const { suggestions, handleSearch } = useAffiliationSearch();
  const toastState = useToast(); // Access the toast state from context
  const router = useRouter();

  // NOTE: This text is just for testing the richtext editors
  const html = String.raw;
  const richtextDefault = html`
    <p>
      In the project, various analytical methods will be used for characterization of compounds. For the (re)synthesis
      of guanidine-modified monomers and metal complexes nuclear magnetic resonance spectroscopy (NMR), infrared
      spectroscopy (IR), mass spectrometry (MS), X-Ray diffraction (XRD), and electron paramagnetic resonance
      spectroscopy (EPR) will be used as analytical methods if applicable. Guanidine-modified microgels and metal-loaded
      microgels will be analyzed if applicable with NMR, IR, dynamic light scattering (DLS), scanning transmission
      electron microscopy (STEM), Raman, EPR, and inductively coupled plasma optical emission spectroscopy (ICP-OES).
      NMR, ICP-OES and gas chromatography (GC) will be used as analytical methods for catalytic reactions.
    </p>
    <p>
      For all analytical methods the data type, format, and estimated volume of a single data file are summarized in the
      following table. Data that will be measured by cooperation partners are marked with an asterisk (*). Already
      existing data of the analytical methods will be reused in the stated formats.
    </p>
    <table
      style="border-collapse: collapse; width: 99.9706%;"
      border="1"
    >
      <colgroup>
        <col style="width: 20%;" />
        <col style="width: 20%;" />
        <col style="width: 20%;" />
        <col style="width: 20%;" />
        <col style="width: 20%;" />
      </colgroup>
      <tbody>
        <tr style="height: 39px;">
          <td><strong>Analytical method</strong></td>
          <td><strong>Data type</strong></td>
          <td><strong>Data format</strong></td>
          <td><strong>Estimated volume for a single data file</strong></td>
          <td><strong>Preferred software for data evaluation</strong></td>
        </tr>
        <tr>
          <td>NMR</td>
          <td>Measurement raw data in xy file format</td>
          <td>Raw data: .fid<br />Final data: .jcamp</td>
          <td>1-30 MB<br />1-5 MB</td>
          <td>Chemotion ELN (or Mestre Nova)</td>
        </tr>
        <tr style="height: 39px;">
          <td>IR</td>
          <td>Measurement raw data in xy file format</td>
          <td>Raw data: .dx<br />Final data: .dx</td>
          <td>&lt;50 KB</td>
          <td>Chemotion ELN</td>
        </tr>
        <tr style="height: 39px;">
          <td>MS</td>
          <td>Measurement raw data in xy file format</td>
          <td>Raw data: .xy<br />Final data: .pdf</td>
          <td>10 MB<br />&lt;100 KB</td>
          <td>---</td>
        </tr>
        <tr style="height: 21px;">
          <td>XRD</td>
          <td>final integrated and refined XRD data</td>
          <td>.cif<br />.res<br />.docx</td>
          <td><br />&lt;50 KB<br />&lt;100 KB</td>
          <td>&nbsp;</td>
        </tr>
        <tr style="height: 39px;">
          <td>EPR</td>
          <td>Measurement raw data in xy file format</td>
          <td>.txt</td>
          <td>&lt;100 KB</td>
          <td>&nbsp;</td>
        </tr>
        <tr style="height: 21px;">
          <td>DLS *</td>
          <td>Data measured by cooperation partners</td>
          <td>.asc</td>
          <td>&lt;50 KB</td>
          <td>---</td>
        </tr>
        <tr style="height: 21px;">
          <td>STEM *</td>
          <td>Data measured by cooperation partners</td>
          <td>.tif</td>
          <td>5 MB</td>
          <td>---</td>
        </tr>
        <tr style="height: 21px;">
          <td>Raman *</td>
          <td>Data measured by cooperation partners</td>
          <td>???</td>
          <td>???</td>
          <td>---</td>
        </tr>
        <tr style="height: 21px;">
          <td>ICP-OES *</td>
          <td>Summarized evaluation of the data measured by cooperation partners</td>
          <td>.xlsx</td>
          <td>&lt;50 KB</td>
          <td>---</td>
        </tr>
        <tr style="height: 39px;">
          <td>GC</td>
          <td>Measurement raw data in xy file format</td>
          <td>Raw data: .txt<br />Final data: .pdf</td>
          <td>&lt;1 MB<br />&lt;100 KB</td>
          <td>---</td>
        </tr>
      </tbody>
    </table>

    <p>
      (Raw) data generated within the working group Herres-Pawlis at the Institute of Inorganic Chemistry, RWTH Aachen
      University will be saved at least in a non-proprietary file format for reuse by scientists within the project, by
      collaboration partners, and by others after publication of the (raw) data.
    </p>
    <ol>
      <li style="font-weight: bold;"><strong>Information Needed for Future Interpretation:</strong></li>
    </ol>
    <p>
      The following information will be required in order to guarantee that the data can be read and interpreted in the
      future:
    </p>
    <ul>
      <li>
        <em><strong>Data Provenance</strong></em
        >: Information about who created or contributed to the data, including contact details.
      </li>
      <li>
        <em><strong>Title and Description</strong></em
        >: a detailed description of the data, including the research context and objectives.
      </li>
      <li>
        <strong><em>Creation Date:</em></strong> When the data was collected or created.
      </li>
      <li>
        <em>Conditions <strong>of Access:</strong></em> Any restrictions on access, including licensing and consent.
      </li>
      <li>
        <em><strong>Methodology:</strong></em> Detailed information on how the data was collected, processed, and
        analyzed.
      </li>
      <li>
        <em><strong>Variable Definitions</strong></em
        >: Definitions and descriptions of all variables and data fields.
      </li>
      <li>
        <em><strong>Units of Measurement</strong></em
        >: Specifications of units for all quantitative data.
      </li>
      <li>
        <em><strong>Assumptions</strong></em
        >: Any assumptions made during data collection and processing.<br />Formats and File Types: Details of the file
        formats and types used.
      </li>
      <li>
        <em><strong>Metadata Standards</strong></em
        >: Standards used for metadata to ensure consistency and interoperability.
      </li>
    </ul>
    <p>2. <strong>Capturing and creating Documentation and Metadata:</strong></p>
    <p><strong>Data Collection Phase:</strong></p>
    <ul>
      <li>
        <em><strong>Documentation Forms</strong></em
        >: during data collection, metadata can be captured using standardized documentation forms.
      </li>
      <li>
        <em><strong>Electronic Data Capture Systems:</strong></em> Implement electronic data capture (EDC) systems with
        built-in metadata fields.
      </li>
    </ul>
    <p><strong>Post-Collection Phase</strong>:</p>
    <ul>
      <li>
        <em><strong>Metadata Repositories: </strong></em>Store metadata in centralized repository with controlled
        access.
      </li>
      <li>
        <em><strong>Version Control Systems:</strong></em> Version control systems can be used to keep track of metadata
        updates and changes.
      </li>
    </ul>
    <p><strong>3. Metadata Standards:&nbsp;</strong></p>
    <ul>
      <li>Dublin Core Metadata Element Set (DCMES):</li>
      <li>
        <em><strong>Reason:</strong></em> Widely used and accepted standard for basic metadata, ensuring broad
        compatibility and interoperability.
      </li>
      <li>
        <em><strong>Elements: </strong></em>Includes elements like Title, Creator, Subject, Description, Publisher,
        Contributor, Date, Type, Format, Identifier, Source, Language, Relation, Coverage, and Rights.
      </li>
    </ul>
    <p><strong>Data Documentation Initiative (DDI):</strong></p>
    <ul>
      <li>
        <em><strong>Reason:</strong></em> Specifically designed for the social, behavioral, economic, and health
        sciences.
      </li>
      <li>
        <em><strong>Elements:</strong></em> Provides detailed metadata for surveys, including study-level, file-level,
        and variable-level metadata.
      </li>
    </ul>
    <p><strong>4. Types of Documentation Accompanying the Data:</strong></p>
    <p><strong>Basic Details:</strong></p>
    <ul>
      <li>
        <em><strong>Creator/Contributor Information:</strong></em> Names, roles, and contact details of data creators
        and contributors.
      </li>
      <li>
        <em><strong>Title:</strong></em> A clear and descriptive title for the dataset.
      </li>
      <li>
        <em><strong>Date of Creation:</strong></em> The date when the dataset was created.
      </li>
      <li>
        <em><strong>Access Conditions: </strong></em>Licensing information, consent details, and any access
        restrictions.
      </li>
    </ul>
    <p><strong>Methodological Documentation:</strong></p>
    <ul>
      <li>
        <em><strong>Research Methodology: </strong></em>Detailed explanation of the research design, data collection
        methods, and analytical techniques.
      </li>
      <li>
        <strong><em>Procedural Information</em>:</strong> Step-by-step procedures followed during data collection and
        processing.
      </li>
      <li>
        <em><strong>Analytical Methods:</strong></em> Description of analytical methods and software used.
      </li>
    </ul>
    <p><strong>Variable Documentation:</strong></p>
    <ul>
      <li>
        <strong>Variable Definitions:</strong> Clear definitions and descriptions of each variable in the dataset.
      </li>
      <li><strong>Units of Measurement:</strong> Specifications of units for all quantitative data.</li>
      <li>
        <strong>Vocabularies and Ontologies:</strong> Controlled vocabularies and ontologies used for data annotation.
      </li>
    </ul>
    <p><strong>Data File Information:</strong></p>
    <ul>
      <li>
        <strong>File Formats and Types:</strong> Details of file formats (e.g., CSV, JSON, XML) and their structures.
      </li>
      <li>
        <strong>Data Structure:</strong> Description of the organization of data within files (e.g., rows, columns,
        headers).
      </li>
    </ul>
    <p>5. <strong>Capturing and Recording Information:</strong></p>
    <ul>
      <li>
        <em><strong>Metadata Templates:</strong></em> Use standardized templates to ensure consistent metadata capture.
      </li>
      <li>
        <em><strong>Electronic Documentation: </strong></em>Store documentation in electronic formats (e.g., PDF, DOCX)
        alongside data files.
      </li>
      <li>
        <em><strong>Metadata Fields in Data Files:</strong></em> Include metadata fields directly within data files
        where appropriate (e.g., CSV headers, JSON metadata sections).
      </li>
      <li>
        <em><strong>Centralized Repositories:</strong></em> Maintain a centralized metadata repository for easy access
        and management.
      </li>
    </ul>
    <p>&nbsp;</p>
  `;

  const [editorContent, setEditorContent] = useState(richtextDefault);

  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const showToastAndRedirect = () => {
    toastState.add("You have successfully logged in.", { type: "success" });
    router.push("/");
  };

  // To test the funder search results
  const [funders, setFunders] = useState<AffiliationSearch[]>([]);
  const [moreCounter, setMoreCounter] = useState(0);

  function onFunderResults(results: AffiliationSearchResults) {
    if (results) {
      const items = (results.items ?? []).filter((f): f is AffiliationSearch => f != null);
      setFunders(items);
    }
  }

  return (
    <>
      <LayoutWithPanel id="sgLayout">
        <SidebarPanel isOpen={true}>
          <h3>Contents</h3>

          <a href="#_intro">Introduction</a>
          <a href="#_brand">Branding & Colours</a>
          <a href="#_typography">Typography</a>
          <a href="#_icons">Icons</a>
          <a href="#_layout">Layout</a>
          <a href="#_containers">Containers</a>
          <a href="#_forms">Forms</a>
          <a href="#_fields_text">Text Fields</a>
          <a href="#_fields_textarea">Textarea Fields</a>
          <a href="#_fields_radio">Radio Fields</a>
          <a href="#_fields_checkbox">Checkbox Fields</a>
          <a href="#_fields">Form Fields</a>
          <a href="#_table">Table</a>
          <a href="#_widgets">Custom Widget</a>
          <a href="#_tooltipWithDialog">Tooltip with dialog</a>
          <a href="#_tinymce">TinyMCE Editor</a>
          <a href="#_toast">Toast Messages</a>
          <a href="#_questionpreview">QuestionPreview Bottomsheet</a>
          <a href="#_fundersearch">Funder Search</a>
        </SidebarPanel>

        <ContentContainer id="sgContent">
          <h1>Living Styleguide</h1>

          <div id="_intro">
            <h2>Introduction</h2>
            <p>TBD... (Why, Living Styleguide?, Updates, How-to-use)</p>
          </div>

          <div id="_brand">
            <h2>Color System</h2>

            <h3>Brand Colors</h3>
            <p>
              Our primary brand colors represent our identity and should be used consistently across all interfaces.
            </p>
            <div className="brand-color-list">
              <BrandColor varname="--brand-primary" />
              <BrandColor varname="--brand-secondary" />
              <BrandColor varname="--brand-tertiary" />
              <BrandColor varname="--brand-error" />
            </div>

            <h3>Gray Scale</h3>
            <p>Our gray scale palette provides a range of tones for text, backgrounds, and UI elements.</p>
            <div className="layout-horizontal">
              <div className="brand-color-list">
                <BrandColor
                  varname="--gray-50"
                  description="Backgrounds, cards"
                />
                <BrandColor
                  varname="--gray-100"
                  description="Disabled states"
                />
                <BrandColor
                  varname="--gray-200"
                  description="Borders, dividers"
                />
                <BrandColor
                  varname="--gray-300"
                  description="Secondary borders"
                />
                <BrandColor
                  varname="--gray-400"
                  description="Placeholder text"
                />
                <BrandColor
                  varname="--gray-500"
                  description="Secondary text"
                />
                <BrandColor
                  varname="--gray-600"
                  description="Primary text"
                />
              </div>
            </div>

            <h3>Purple Scale</h3>
            <p>Purple tones are used for interactive elements, focus states, and to draw attention.</p>
            <div className="layout-horizontal">
              <div className="brand-color-list">
                <BrandColor
                  varname="--purple-100"
                  description="Light backgrounds"
                />
                <BrandColor
                  varname="--purple-200"
                  description="Hover states"
                />
                <BrandColor
                  varname="--purple-300"
                  description="Active states"
                />
                <BrandColor
                  varname="--purple-400"
                  description="Focus rings"
                />
                <BrandColor
                  varname="--purple-500"
                  description="Primary actions"
                />
                <BrandColor
                  varname="--purple-600"
                  description="Pressed states"
                />
              </div>
            </div>

            <h3>Red Scale</h3>
            <p>Red tones are used for errors, warnings, and destructive actions.</p>
            <div className="layout-horizontal">
              <div className="brand-color-list">
                <BrandColor
                  varname="--red-100"
                  description="Error backgrounds"
                />
                <BrandColor
                  varname="--red-200"
                  description="Error hover"
                />
                <BrandColor
                  varname="--red-300"
                  description="Error active"
                />
                <BrandColor
                  varname="--red-400"
                  description="Error text"
                />
                <BrandColor
                  varname="--red-500"
                  description="Error borders"
                />
                <BrandColor
                  varname="--red-600"
                  description="Error pressed"
                />
              </div>
            </div>

            <h3>Slate Scale</h3>
            <p>Slate colors provide additional neutral tones for sophisticated UI elements.</p>
            <div className="layout-horizontal">
              <div className="brand-color-list">
                <BrandColor
                  varname="--slate-100"
                  description="Light backgrounds"
                />
                <BrandColor
                  varname="--slate-200"
                  description="Borders"
                />
                <BrandColor
                  varname="--slate-300"
                  description="Dividers"
                />
                <BrandColor
                  varname="--slate-400"
                  description="Icons"
                />
                <BrandColor
                  varname="--slate-500"
                  description="Secondary text"
                />
                <BrandColor
                  varname="--slate-600"
                  description="Primary text"
                />
                <BrandColor
                  varname="--slate-700"
                  description="Headings"
                />
                <BrandColor
                  varname="--slate-800"
                  description="Dark backgrounds"
                />
                <BrandColor
                  varname="--slate-900"
                  description="Highest contrast"
                />
              </div>
            </div>

            <h3>Messaging colors</h3>
            <p>Our messages are broken down into the types: info, success and error</p>
            <div className="brand-color-list">
              <BrandColor varname="--messaging-info" />
              <BrandColor varname="--messaging-success" />
              <BrandColor varname="--messaging-error" />
            </div>

            <h3>Usage Guidelines</h3>
            <ul>
              <li>Use brand colors sparingly to maintain their impact</li>
              <li>Gray scale should be the foundation of most UI elements</li>
              <li>Ensure sufficient contrast for accessibility (WCAG 2.1 AA standards)</li>
              <li>Purple scale is for interactive elements and focus states</li>
              <li>Red scale should be reserved for errors and destructive actions</li>
              <li>Slate scale provides sophisticated alternatives to pure gray</li>
            </ul>
          </div>

          <div id="_typography">
            <h2>Typography System</h2>

            <p>Fonts, Weights, Headings, Paragraphs, Links, Lists, line-spacing rules etc…</p>

            <h3>Font Sizes</h3>
            <p>Our type scale is based on a 16px base size (1rem) with consistent scaling for readability.</p>

            <div className="type-scale-examples">
              <div className="type-example">
                <p>Normal paragraph text</p>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
              </div>

              <div className="type-example">
                <h1>Heading 1 - 1.5rem (24px)</h1>
              </div>

              <div className="type-example">
                <h2>Heading 2 - 1.25rem (20px)</h2>
              </div>

              <div className="type-example">
                <h3>Heading 3 - 1.125rem (18px)</h3>
              </div>

              <div className="type-example">
                <h4>Heading 4 - 1rem (16px)</h4>
              </div>

              <div className="type-example">
                <h5>Heading 5 - 0.875rem (14px)</h5>
              </div>
            </div>

            <div className="type-scale-examples">
              <div className="type-example">
                <h1 style={{ fontSize: "var(--fs-4xl)" }}>4xl - 2.25rem (36px)</h1>
                <code>--fs-4xl</code>
              </div>

              <div className="type-example">
                <h2 style={{ fontSize: "var(--fs-3xl)" }}>3xl - 1.875rem (30px)</h2>
                <code>--fs-3xl</code>
              </div>

              <div className="type-example">
                <h3 style={{ fontSize: "var(--fs-2xl)" }}>2xl - 1.5rem (24px)</h3>
                <code>--fs-2xl</code>
              </div>

              <div className="type-example">
                <h4 style={{ fontSize: "var(--fs-xl)" }}>xl - 1.25rem (20px)</h4>
                <code>--fs-xl</code>
              </div>

              <div className="type-example">
                <h5 style={{ fontSize: "var(--fs-lg)" }}>lg - 1.125rem (18px)</h5>
                <code>--fs-lg</code>
              </div>

              <div className="type-example">
                <h6 style={{ fontSize: "var(--fs-base)" }}>base - 1rem (16px)</h6>
                <code>--fs-base</code>
              </div>

              <div className="type-example">
                <p style={{ fontSize: "var(--fs-small)" }}>Small - 0.875rem (14px)</p>
                <code>--fs-small</code>
              </div>
            </div>

            <h3>Line Heights</h3>
            <p>Different line heights are used to improve readability based on the content type and size.</p>

            <div className="line-height-examples">
              <div className="line-height-example">
                <p style={{ lineHeight: "var(--lh-tight)" }}>
                  Tight (1.1) - Used for headings and short text blocks where compact spacing is needed. This is an
                  example of how the text looks with tight line height. Notice how the lines are closer together.
                </p>
                <code>--lh-tight</code>
              </div>

              <div className="line-height-example">
                <p style={{ lineHeight: "var(--lh-normal)" }}>
                  Normal (1.5) - Used for regular paragraph text and most content. This is an example of how the text
                  looks with normal line height. Notice how it is more readable for longer content.
                </p>
                <code>--lh-normal</code>
              </div>

              <div className="line-height-example">
                <p style={{ lineHeight: "var(--lh-loose)" }}>
                  Loose (1.8) - Used for improved readability in larger blocks of text. This is an example of how the
                  text looks with loose line height. Notice how it is more spacious and easier to read in longer forms.
                </p>
                <code>--lh-loose</code>
              </div>
            </div>

            <h3>Text Styles</h3>

            <h4>Links</h4>
            <div className="text-style-example">
              <p>
                Links come in different states:
                <a
                  href="#"
                  style={{ color: "var(--link-color)" }}
                >
                  Regular Link
                </a>
                ,
                <a
                  href="#"
                  style={{ color: "var(--link-color-secondary)" }}
                >
                  Secondary Link
                </a>
                ,
                <a
                  href="#"
                  style={{ color: "var(--link-hover-color)" }}
                >
                  Hover State
                </a>
              </p>
              <div>
                We should try to use Next Link e.g.
                <code> {`<Link href="/about">About</Link>`} </code>
              </div>

              <div className="sg-button-list">
                <Link>Standard link</Link>
                <Link
                  href="/"
                  className="button-secondary"
                >
                  Button Link
                </Link>
              </div>
            </div>

            <h4>Lists</h4>
            <div className="list-examples">
              <div className="list-example">
                <h5>Unordered List</h5>
                <ul>
                  <li>First item in an unordered list</li>
                  <li>Second item in an unordered list</li>
                  <li>
                    Third item with a <a href="#">link example</a>
                  </li>
                  <li>Fourth item in an unordered list</li>
                </ul>
              </div>

              <div className="list-example">
                <h5>Ordered List</h5>
                <ol>
                  <li>First item in an ordered list</li>
                  <li>Second item in an ordered list</li>
                  <li>
                    Third item with a <a href="#">link example</a>
                  </li>
                  <li>Fourth item in an ordered list</li>
                </ol>
              </div>
            </div>

            <h3>Text Colors</h3>
            <div className="text-color-examples">
              <p style={{ color: "var(--text-color)" }}>Primary Text Color</p>
              <p style={{ color: "var(--text-color-base)" }}>Base Text Color</p>
              <p style={{ color: "var(--text-color-disabled)" }}>Disabled Text Color</p>
              <p style={{ color: "var(--text-color-placeholder)" }}>Placeholder Text Color</p>
            </div>
          </div>

          <div id="_icons">
            <h2>Icons</h2>
            <Example>
              <div className="sg-icons">
                <DmpIcon icon="home" />
                <DmpIcon icon="search" />
                <DmpIcon icon="settings" />
                <DmpIcon icon="favorite" />
                <DmpIcon icon="format_bold" />
                <DmpIcon icon="double_arrow" />
                <DmpIcon icon="info" />
                <DmpIcon icon="cancel" />
                <DmpIcon icon="trashcan" />
                <DmpIcon icon="table" />
                <DmpIcon icon="chat" />
                <DmpIcon icon="format_bold" />
                <DmpIcon icon="format_italic" />
                <DmpIcon icon="format_underlined" />
                <DmpIcon icon="format_list_bulleted" />
                <DmpIcon icon="format_list_numbered" />
                <DmpIcon icon="double_arrow" />
                <DmpIcon icon="check_circle" />
                <DmpIcon icon="error_circle" />
                <DmpIcon icon="close" />
                <DmpIcon icon="right-panel_close" />
                <DmpIcon icon="solid-left_arrow" />
                <DmpIcon icon="solid-right_arrow" />
                <DmpIcon icon="solid-down_arrow" />
              </div>
            </Example>

            <p>You can style the icons with the following CSS variables:</p>
            <dl>
              <dt>
                <code>--icon-stroke</code>
              </dt>
              <dd>
                Set the icon stroke colour. The default stroke colour is <code>transparent</code>.
              </dd>

              <dt>
                <code>--icon-fill</code>
              </dt>
              <dd>
                Set the icon fill colour. The default is <code>var(--text-color)</code>
              </dd>

              <dt>
                <code>--icon-stroke-width</code>
              </dt>
              <dd>
                Set the stroke width. The default for this is <code>0</code>.
              </dd>
            </dl>
          </div>

          <div id="_layout">
            <h2>Spacing System</h2>

            <h3>Base Spacing Scale</h3>
            <p>
              Our spacing system uses a consistent scale based on 4px increments. This ensures visual rhythm and
              consistency across the interface.
            </p>

            <div className="spacing-scale">
              {/* Spacing Scale Visual Examples */}
              <div className="spacing-example">
                <div
                  className="spacing-box"
                  style={{
                    width: "var(--space-1)",
                    height: "var(--space-1)",
                  }}
                ></div>
                <div className="spacing-details">
                  <code>--space-1</code>
                  <span>0.25rem (4px)</span>
                  <span>Smallest spacing, used for tight gaps</span>
                </div>
              </div>

              <div className="spacing-example">
                <div
                  className="spacing-box"
                  style={{
                    width: "var(--space-2)",
                    height: "var(--space-2)",
                  }}
                ></div>
                <div className="spacing-details">
                  <code>--space-2</code>
                  <span>0.5rem (8px)</span>
                  <span>Icon spacing, tight paddings</span>
                </div>
              </div>

              <div className="spacing-example">
                <div
                  className="spacing-box"
                  style={{
                    width: "var(--space-3)",
                    height: "var(--space-3)",
                  }}
                ></div>
                <div className="spacing-details">
                  <code>--space-3</code>
                  <span>0.75rem (12px)</span>
                  <span>Form element spacing</span>
                </div>
              </div>

              <div className="spacing-example">
                <div
                  className="spacing-box"
                  style={{
                    width: "var(--space-4)",
                    height: "var(--space-4)",
                  }}
                ></div>
                <div className="spacing-details">
                  <code>--space-4</code>
                  <span>1rem (16px)</span>
                  <span>Base spacing unit</span>
                </div>
              </div>

              <div className="spacing-example">
                <div
                  className="spacing-box"
                  style={{
                    width: "var(--space-5)",
                    height: "var(--space-5)",
                  }}
                ></div>
                <div className="spacing-details">
                  <code>--space-5</code>
                  <span>1.5rem (24px)</span>
                  <span>Medium component spacing</span>
                </div>
              </div>

              <div className="spacing-example">
                <div
                  className="spacing-box"
                  style={{
                    width: "var(--space-6)",
                    height: "var(--space-6)",
                  }}
                ></div>
                <div className="spacing-details">
                  <code>--space-6</code>
                  <span>2rem (32px)</span>
                  <span>Large component spacing</span>
                </div>
              </div>

              <div className="spacing-example">
                <div
                  className="spacing-box"
                  style={{
                    width: "var(--space-8)",
                    height: "var(--space-8)",
                  }}
                ></div>
                <div className="spacing-details">
                  <code>--space-8</code>
                  <span>3rem (48px)</span>
                  <span>Section spacing</span>
                </div>
              </div>

              <div className="spacing-example">
                <div
                  className="spacing-box"
                  style={{
                    width: "var(--space-10)",
                    height: "var(--space-10)",
                  }}
                ></div>
                <div className="spacing-details">
                  <code>--space-10</code>
                  <span>4rem (64px)</span>
                  <span>Large section spacing</span>
                </div>
              </div>

              <div className="spacing-example">
                <div
                  className="spacing-box"
                  style={{
                    width: "var(--space-12)",
                    height: "var(--space-12)",
                  }}
                ></div>
                <div className="spacing-details">
                  <code>--space-12</code>
                  <span>6rem (96px)</span>
                  <span>Extra large section spacing</span>
                </div>
              </div>
            </div>

            <h3>Utility Classes</h3>
            <p>
              Our spacing utilities follow a consistent naming convention for margins and paddings. The grey box
              represents the parent container, and the purple box shows the applied spacing.
            </p>

            <div className="utility-examples">
              <h4>Margin Utilities</h4>
              <div className="utility-section">
                <div className="demo-container">
                  <div className="example-box m-4">m-4 (margin: 1rem)</div>
                </div>

                <div className="demo-container">
                  <div className="example-box my-4">my-4 (margin-top & bottom: 1rem)</div>
                </div>

                <div className="demo-container">
                  <div className="example-box mx-4">mx-4 (margin-left & right: 1rem)</div>
                </div>

                <div className="demo-container">
                  <div className="example-box mt-4">mt-4 (margin-top: 1rem)</div>
                </div>

                <div className="demo-container">
                  <div className="example-box mb-4">mb-4 (margin-bottom: 1rem)</div>
                </div>

                <div className="demo-container">
                  <div className="example-box ms-4">ms-4 (margin-left: 1rem)</div>
                </div>

                <div className="demo-container">
                  <div className="example-box me-4">me-4 (margin-right: 1rem)</div>
                </div>
              </div>

              <h4>Padding Utilities</h4>
              <div className="utility-section">
                <div className="demo-container">
                  <div className="example-box p-4">p-4 (padding: 1rem)</div>
                </div>

                <div className="demo-container">
                  <div className="example-box py-4">py-4 (padding-top & bottom: 1rem)</div>
                </div>

                <div className="demo-container">
                  <div className="example-box px-4">px-4 (padding-left & right: 1rem)</div>
                </div>

                <div className="demo-container">
                  <div className="example-box pt-4">pt-4 (padding-top: 1rem)</div>
                </div>

                <div className="demo-container">
                  <div className="example-box pb-4">pb-4 (padding-bottom: 1rem)</div>
                </div>

                <div className="demo-container">
                  <div className="example-box ps-4">ps-4 (padding-left: 1rem)</div>
                </div>

                <div className="demo-container">
                  <div className="example-box pe-4">pe-4 (padding-right: 1rem)</div>
                </div>
              </div>
            </div>

            <h3>Responsive Utilities</h3>
            <p>All spacing utilities can be applied at different breakpoints using responsive prefixes.</p>

            <div className="responsive-examples">
              <code>mt-2 mt-md-4 mt-lg-6</code>
              <ul>
                <li>Default: 0.5rem margin-top</li>
                <li>md (768px): 1rem margin-top</li>
                <li>lg (1024px): 2rem margin-top</li>
              </ul>
            </div>
          </div>

          <div id="_layout">
            <h2>Component Spacing</h2>
            <p>
              We use three different spacings for various components. When developing components, or working without
              layout, make sure to use these variables so that spacing is consistent throughout the application.
            </p>

            <dl>
              <dt>
                <code>--brand-space1</code>
              </dt>
              <dd>Used primarily for padding inside buttons and other input fields.</dd>

              <dt>
                <code>--brand-space2</code>
              </dt>
              <dd>This is the main spacing used between different components on the page.</dd>

              <dt>
                <code>--brand-space3</code>
              </dt>
              <dd>Description and Use Case TBD...</dd>
            </dl>

            <h2>Typographic Spacing</h2>
            <p>Different variables for enforcing consistent line heights and legible typography.</p>

            <dl>
              <dt>
                <code>--brand-line-height0</code>
              </dt>
              <dd>This is the standard line hight to use for general text and input fields.</dd>

              <dt>
                <code>--brand-line-height1</code>
              </dt>
              <dd>
                For longer form guidance text where some individuals may struggle with larger paragraphs of text, we use
                a slightly higher line height. Also useful for some headings, where we want some extra space between the
                heading and content following it.
              </dd>

              <dt>
                <code>--brand-line-height2</code>
              </dt>
              <dd>
                Mostly used for headings where we want clear separation between the heading and content following it.
              </dd>
            </dl>

            <h2>Naming Conventions</h2>
            <ul className="sg-spaced">
              <li>
                Use <code>TitleCase</code> for componen tags, ie.
                <br />
                <code>{"<SomeElement />"}</code>
              </li>
              <li>
                Use <code>camelCase</code> for element ID&lsquo;s, ie.
                <br />
                <code>{'<SomeElement id="myElement"/>'}</code>
              </li>
              <li>
                Use <code>kebab-case</code> for css classnames (Using titlecase for every word beween hiphens is okay),
                ie.
                <br />
                <code>{'<SomeElement className="some-class-Name"/>'}</code>
              </li>
              <li>
                Use <code>snake_case</code> for field names, ie.
                <br />
                <code>{'<SomeElement name="field_name" />'}</code>
              </li>
              <li>
                When elements have multiple properties, prefer to have each property on it&lsquo;s own line, so that
                it&lsquo;s faster to find specific properties, and easier to add &amp; remove. Eg.
                <div>
                  <pre>
                    <code>
                      {`<SomeElement
  prop1="A"
  prop2="B"
  prop3="C"
  prop4="D"
\\>`}
                    </code>
                  </pre>
                </div>
              </li>

              <li>
                The same applies to import statements. Though more verbose, allows for better legibility and faster
                changes.
                <div>
                  <pre>
                    <code>
                      {`import {
  Button,
  Label,
  TextField,
  Input,
  FieldError,
  Form,
} from "react-area-components";
`}
                    </code>
                  </pre>
                </div>
              </li>

              <li>
                Use a <em>leading underscore</em> for &ldquo;private&ldquo; css variables. This is handy when working on
                larger components that use duplicate styles throughout. We create a private variable to reduce
                duplication and potential typos, especially when working with larger components.
                <div>
                  <pre>
                    <code>
                      {`.grid-view {
    --_gap: var(--grid-list-grid-gap, 1rem);

    display: grid;

    padding: var(--_gap);
    grid-gap: var(--_gap);
    grid-template-columns: repeat(4, 1fr);
    grid-template-rows: auto;
  }
`}
                    </code>
                  </pre>
                </div>
              </li>
            </ul>
          </div>

          <div id="_containers">
            <h2>
              <code>Layout Container</code>
            </h2>
            <p>
              The standard <code>{`<LayoutContainer>`}</code> wraps content containers to provide some common container
              within the layout container.
            </p>
            <LayoutContainer>
              <ContentContainer>
                <div>
                  <pre>
                    <code>
                      {`<LayoutContainer>
  <ContentContainer> ... </ContentContainer>
</LayoutContainer>
`}
                    </code>
                  </pre>
                </div>
              </ContentContainer>
            </LayoutContainer>

            <h3>CSS Variables</h3>
            <dl>
              <dt>
                <code>--layout-container-padding</code>
              </dt>
              <dd>
                Set the container padding, defaults to: <code>0</code>
              </dd>

              <dt>
                <code>--layout-container-background</code>
              </dt>
              <dd>
                Set the container background, defaults to: <code>transparent</code>
              </dd>
            </dl>

            <h2>
              <code>Content Container</code>
            </h2>
            <ContentContainer>
              <p>This content is wrapped in the following container.</p>
              <p>
                <strong>Note</strong> that the style property is not required to use the container. It&apos;s only here
                to show that you can use it this way, and to show the outline here in the styleguide.
              </p>
              <div>
                <pre>
                  <code>
                    {`<ContentContainer>
...
</ContentContainer>`}
                  </code>
                </pre>
              </div>
            </ContentContainer>

            <h3>CSS Variables</h3>
            <dl>
              <dt>
                <code>--layout-content-padding</code>
              </dt>
              <dd>
                Set the content container padding, defaults to: <code>var(--brand-space2)</code>
              </dd>

              <dt>
                <code>--layout-container-background</code>
              </dt>
              <dd>
                Set the container background, defaults to: <code>transparent</code>
              </dd>
            </dl>

            <h2>
              <code>ToolbarContainer</code>
            </h2>
            <p>
              <code>LayoutContainer &gt; ToolbarContainer</code>
            </p>
            <ToolbarContainer>
              <p>Some toolbar text, maybe a Title</p>
              <Button>Button</Button>
            </ToolbarContainer>

            <h3>CSS Variables</h3>
            <p>
              Since this inherits from <code>LayoutContainer</code> those CSS variables also works. In addition to
              those, the following is also available:
            </p>
            <dl>
              <dt>
                <code>--layout-gap</code>
              </dt>
              <dd>
                This container uses flexbox, and this variable sets the <code>gap</code> css property. Defaults to{" "}
                <code>1em</code>
              </dd>
            </dl>

            <h2>Layout With Panel (Sidebar)</h2>
            <p>This is a composite layout component that contains a sidebar alongside a content container.</p>
            <p>
              <code>LayoutContainer &gt; LayoutWithPanel</code>
            </p>
            <p>
              <code>ContentContainer &gt; SidebarPanel</code>
            </p>
            <ToolbarContainer>
              <Button onPress={toggleSidebar}>Toggle Sidebar</Button>
            </ToolbarContainer>
            <LayoutWithPanel className="sg-sidebar">
              <ContentContainer>
                <h3>Layout With Sidebar</h3>
                <p>This is the primary content for the slider component</p>

                <div>
                  <pre>
                    <code>
                      {`<LayoutWithPanel>
  <ContentContainer> ... </ContentContainer>
  <SidebarPanel> ... </SidebarPanel>
</LayoutWithPanel>
`}
                    </code>
                  </pre>
                </div>
              </ContentContainer>

              <SidebarPanel isOpen={sidebarOpen}>
                <p>This is the sidebar for the component</p>
              </SidebarPanel>
            </LayoutWithPanel>

            <p>
              <code>LayoutWithPanel</code> &nbsp; can have a <code>ToolbarContainer</code> in addition to the sidebar.
              and content.
            </p>

            <LayoutWithPanel className="sg-sidebar">
              <ToolbarContainer>
                <p>
                  This is a toolbar inside <code>LayoutWithPanel</code>
                </p>
              </ToolbarContainer>

              <ContentContainer>
                <h3>Layout With Sidebar</h3>
                <p>This is the primary content for the slider component</p>
                <div>
                  <pre>
                    <code>
                      {`<LayoutWithPanel>
  <ToolbarContainer> ... </ToolbarContainer>
  <SidebarPanel> ... </SidebarPanel>
  <ContentContainer> ... </ContentContainer>
</LayoutWithPanel>
`}
                    </code>
                  </pre>
                </div>
              </ContentContainer>

              <SidebarPanel>
                <p>This is the sidebar for the slider component</p>
              </SidebarPanel>
            </LayoutWithPanel>

            <p>
              Example with a <code>DrawerPanel</code> instead of a sidebar
            </p>

            <ToolbarContainer>
              <Button onPress={toggleDrawer}>Toggle Drawer</Button>
            </ToolbarContainer>
            <LayoutWithPanel className="sg-sidebar">
              <ContentContainer>TODO: Write about this layout here</ContentContainer>

              <DrawerPanel
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
              >
                <p>This is the Drawer Content</p>
              </DrawerPanel>
            </LayoutWithPanel>

            <h3>SidebarPanel Properties</h3>
            <dl>
              <dt>
                <code>isOpen</code>
              </dt>
              <dd>
                This is a property that will toggle the open/close state for the sidebar. Defaults to <code>true</code>.
              </dd>
            </dl>

            <h3>DrawerPanel Properties</h3>
            <dl>
              <dt>
                <code>isOpen</code>
              </dt>
              <dd>
                This is a property that will toggle the open/close state for the sidebar. Defaults to <code>true</code>.
              </dd>
            </dl>

            <h3>DrawerPanel events</h3>
            <dl>
              <dt>
                <code>onClose</code>
              </dt>
              <dd>If it exists, this handler is called as soon as the drawer is closed.</dd>
            </dl>

            <h3>CSS Variables</h3>
            <p>
              Since this layout inherits from <code>LayoutContainer</code>
              those CSS variables also works. In addition to those, the following is also available:
            </p>

            <dl>
              <dt>
                <code>--layout-gap</code>
              </dt>
              <dd>
                This container uses <code>display: grid</code>, and this variable sets the <code>gap</code> css
                property. Defaults to <code>var(--brand-space2)</code>
              </dd>
            </dl>
          </div>

          <div id="_theme">
            <h2>App Theming</h2>
            <p>The following CSS variables are the primary hooks that set the overall theme for the App.</p>
            <p>
              Any custom components should attempt to use these first, and developers should only need to add new theme
              hooks for specialized components that cannot make use of one of these
            </p>

            <dl>
              <dt>
                <code>--focus-ring-color</code>
              </dt>
              <dd>
                This is the highlight around input fields and other &ldquo;selectable&ldquo; elements. It&lsquo;s a
                visual indicator of where the current focus is.
              </dd>

              <dt>
                <code>--text-color</code>
              </dt>
              <dd>
                This sets the main text color for the element.
                <br />
                Related hooks include:
                <ul>
                  <li>
                    <code>--text-color-hover</code>
                  </li>
                  <li>
                    <code>--text-color-disabled</code>
                  </li>
                  <li>
                    <code>--text-color-placeholder</code>
                  </li>
                </ul>
              </dd>

              <dt>
                <code>--link-color</code>
              </dt>
              <dd>
                This is the main color for links and anchors.
                <br />
                Related hooks include:
                <ul>
                  <li>
                    <code>--link-color-secondary</code>
                  </li>
                  <li>
                    <code>--text-color-pressed</code>
                  </li>
                </ul>
              </dd>

              <dt>
                <code>--border-color</code>
              </dt>
              <dd>
                The border colour to use for the component. <br />
                Related hooks include:
                <ul>
                  <li>
                    <code>--border-color-hover</code>
                  </li>
                  <li>
                    <code>--border-color-pressed</code>
                  </li>
                  <li>
                    <code>--border-color-disabled</code>
                  </li>
                </ul>
              </dd>

              <dt>
                <code>--field-background</code>
              </dt>
              <dd>The background colour for input fields.</dd>

              <dt>
                <code>--field-text-color</code>
              </dt>
              <dd>The background colour for input fields.</dd>

              <dt>
                <code>--overlay-background</code>
              </dt>
              <dd>The background colour for any overlays like modals.</dd>
            </dl>
          </div>

          <div id="_fields_text">
            <h2>TextField</h2>
            <h3>Text</h3>
            <p>A text field allows a user to enter a plain text value with a keyboard.</p>

            <p>
              This is a <em>core component</em>, see the{" "}
              <a href="https://react-spectrum.adobe.com/react-aria/TextField.html">component docs here.</a>
            </p>

            <Example>
              <TextField
                name="example_text"
                isRequired
              >
                <Label>Example Text Field</Label>
                <Text
                  slot="description"
                  className="help"
                >
                  Descriptive text related to the field
                </Text>
                <Input />
              </TextField>
            </Example>

            <h3>Email</h3>

            <h3>SubHeader</h3>
            <SubHeader />
            <TextField
              name="example_email"
              type="email"
              isRequired
            >
              <Label>Email</Label>
              <Text
                slot="description"
                className="help"
              >
                Your email address
              </Text>
              <Input />
              <FieldError />
            </TextField>
          </div>
          <div id="_fields_textarea"></div>
          <div id="_fields_radio"></div>
          <div id="_fields_checkbox"></div>

          <div id="_forms">
            <h2>Buttons</h2>
            <p>
              This is a <em>core component</em>, see the{" "}
              <a href="https://react-spectrum.adobe.com/react-aria/Button.html">component docs here.</a>
            </p>

            <Example>
              <div className="sg-button-list">
                <Button>Standard</Button>
                <Button data-primary>Primary</Button>
                <Button className="secondary">Secondary</Button>
                <Button className="tertiary">Tertiary</Button>
                <Button isDisabled>Disabled</Button>
                <Button className="link">Button Link</Button>
                <ButtonWithImage
                  url="http://localhost:3000"
                  imageUrl="/images/orcid.svg"
                  buttonText="Connect institutional credentials"
                />
              </div>
            </Example>

            <h2>Button Sizes</h2>
            <p>
              Button size can be changed by adding a size modifier class, for example:
              <br /> <code>{'<Button className="primary small">Small Primary</Button>'}</code>.
            </p>

            <Example>
              <div className="sg-button-list">
                <Button className="primary small">Small Primary</Button>
                <Button className="secondary small">Small Secondary</Button>
                <Button className="tertiary small">Small Tertiary</Button>
              </div>
            </Example>

            <h2>Forms</h2>
            <p>
              A form is a group of inputs that allows users to submit data to a server, with support for providing field
              validation errors.
            </p>

            <p>
              This is a <em>core component</em>, see the{" "}
              <a href="https://react-spectrum.adobe.com/react-aria/Form.html">component docs here.</a>
            </p>

            <Example>
              <Form>
                <TextField
                  name="example_email"
                  type="email"
                  isRequired
                >
                  <Label>Email</Label>
                  <Text
                    slot="description"
                    className="help"
                  >
                    Descriptive text related to the field
                  </Text>
                  <Input />
                  <FieldError />
                </TextField>

                <h3>Checkboxes</h3>

                <CheckboxGroup>
                  <Label>Favorite sports</Label>
                  <Text
                    slot="description"
                    className="help"
                  >
                    This is help text
                  </Text>
                  <Checkbox value="soccer">
                    <div className="checkbox">
                      <svg
                        viewBox="0 0 18 18"
                        aria-hidden="true"
                      >
                        <polyline points="1 9 7 14 15 4" />
                      </svg>
                    </div>
                    Test
                  </Checkbox>
                  <Checkbox value="test">
                    <div className="checkbox">
                      <svg
                        viewBox="0 0 18 18"
                        aria-hidden="true"
                      >
                        <polyline points="1 9 7 14 15 4" />
                      </svg>
                    </div>
                    Test
                  </Checkbox>
                </CheckboxGroup>

                <h3>Checkbox</h3>
                <Checkbox>
                  <div className="checkbox">
                    <svg
                      viewBox="0 0 18 18"
                      aria-hidden="true"
                    >
                      <polyline points="1 9 7 14 15 4" />
                    </svg>
                  </div>
                  Unsubscribe
                </Checkbox>

                <h3>Radio</h3>
                <RadioGroup>
                  <Label>Favorite pet</Label>
                  <Text
                    slot="description"
                    className="help"
                  >
                    This is help text
                  </Text>
                  <Radio value="dogs">Dog</Radio>
                  <Radio value="cats">Cat</Radio>
                  <Radio value="dragon">Dragon</Radio>
                </RadioGroup>

                <h3>Select</h3>
                <Select>
                  <Label>Favorite Animal</Label>
                  <Text
                    slot="description"
                    className="help"
                  >
                    This is help text
                  </Text>
                  <Button>
                    <SelectValue />
                    <span aria-hidden="true">▼</span>
                  </Button>
                  <Popover>
                    <ListBox>
                      <ListBoxItem>Aardvark</ListBoxItem>
                      <ListBoxItem>Cat</ListBoxItem>
                      <ListBoxItem>Dog</ListBoxItem>
                      <ListBoxItem>Kangaroo</ListBoxItem>
                      <ListBoxItem>Panda</ListBoxItem>
                      <ListBoxItem>Snake</ListBoxItem>
                    </ListBox>
                  </Popover>
                  <FieldError />
                </Select>

                <h3>Native Select Field</h3>
                <Label>Favorite Animal</Label>
                <select>
                  <option>Aardvark</option>
                  <option>Cat</option>
                </select>

                <h3>Submit button</h3>
                <div className="form-actions mt-5">
                  <Button type="submit">Submit</Button>
                </div>
              </Form>
            </Example>
          </div>

          <div id="_fields">
            <h3>Card</h3>
            <Card
              id="card1"
              data-test="date-test"
            >
              <CardEyebrow>NSF</CardEyebrow>
              <CardHeading>NSF Health research</CardHeading>
              <CardBody>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
              </CardBody>
              <CardMutedText>Updated 1 year ago</CardMutedText>
              <CardFooter>
                <Button>Select</Button>
              </CardFooter>
            </Card>

            <h3>Card with Icon</h3>
            <Card
              id="card1"
              data-test="date-test"
            >
              <CardEyebrow>NSF</CardEyebrow>
              <CardHeading>NSF Health research</CardHeading>
              <CardBody>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
              </CardBody>
              <CardMutedText>Updated 1 year ago</CardMutedText>
              <CardFooter>
                <Button>Select</Button>
              </CardFooter>
            </Card>

            <h2>Section Header</h2>
            <p>
              This is used in template builder where the section is editable below this will be a list of questions
              cards
            </p>

            <SectionHeaderEdit
              key="22424"
              sectionNumber={2}
              title="Test"
              editUrl="/edit"
              onMoveUp={() => null}
              onMoveDown={() => null}
            />

            <h2>Question Card</h2>

            <QuestionEditCard
              key={2552}
              id="24"
              text="This is a question"
              link="/edit"
              name="question"
              handleDisplayOrderChange={() => console.log("reordering")}
            />

            <h2>Typeahead</h2>
            <p>Typeahead, also known as an autosuggest, shows matches to a user query as the user types.</p>

            <Example>
              <TypeAheadInput
                label="Example input"
                fieldName="test"
                required={true}
                updateFormData={() => console.log("updating form")}
                suggestions={suggestions}
                onSearch={handleSearch}
                helpText="Help text describing what types of data the user can search for"
              />
            </Example>

            <h2>Typeahead with Other option</h2>
            <p>
              Typeahead with the inclusion of the &ldquo;Other&rdquo; option. You can pass a setOtherField() method to
              set it to true when the user selects &ldquo;Other&rdquo; option.
            </p>

            <Example>
              <TypeAheadWithOther
                label="Institution"
                fieldName="institution"
                setOtherField={setOtherField}
                isRequired={true}
                helpText="Search for your institution"
                updateFormData={() => console.log("updating form")}
                value="UCOP"
                suggestions={suggestions}
                onSearch={handleSearch}
              />
              {otherField && (
                <TextField
                  type="text"
                  name="institution"
                >
                  <Label>Other institution</Label>
                  <Input placeholder="Enter custom institution name" />
                  <FieldError />
                </TextField>
              )}
            </Example>
          </div>

          <div id="_table">
            <h2>Table</h2>
            <p>
              A table displays data in rows and columns and enables a user to navigate its contents via directional
              navigation keys, and optionally supports row selection and sorting.
            </p>

            <p>
              This is a <em>core component</em>, see the{" "}
              <a href="https://react-spectrum.adobe.com/react-aria/Table.html">component docs here.</a>
            </p>

            <Example>
              <Table aria-label="example-table">
                <TableHeader>
                  <Column isRowHeader={true}>One</Column>
                  <Column isRowHeader={true}>Two</Column>
                  <Column isRowHeader={true}>Three</Column>
                </TableHeader>
                <TableBody>
                  <Row>
                    <Cell>Item One</Cell>
                    <Cell>Item Two</Cell>
                    <Cell>Item Three</Cell>
                  </Row>
                </TableBody>
              </Table>
            </Example>
          </div>

          <div id="_widgets">
            <h2>Tabs</h2>

            <Tabs>
              <TabList aria-label="Question editing">
                <Tab id="edit">Edit Question</Tab>
                <Tab id="second">Second tab</Tab>
                <Tab id="third">Third tab</Tab>
              </TabList>
              <TabPanel id="edit">
                <h2>Create a New Question</h2>

                <Form>
                  <TextField
                    name="question_text"
                    type="text"
                    isRequired
                  >
                    <Label>Question text</Label>
                    <Text
                      slot="description"
                      className="help"
                    >
                      Enter the question that you want to include in this section.
                    </Text>
                    <Input />
                    <FieldError />
                  </TextField>

                  <TextField
                    name="question_help_text"
                    type="text"
                  >
                    <Label>Help text</Label>
                    <Text
                      slot="description"
                      className="help"
                    >
                      Optionally, provide help text or additional context for this question.
                    </Text>
                    <Input />
                    <FieldError />
                  </TextField>

                  <Button type="submit">Create Question</Button>
                </Form>
              </TabPanel>
              <TabPanel id="second">
                <h3>Text</h3>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed</p>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed</p>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed</p>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed</p>
              </TabPanel>
              <TabPanel id="third">
                <h3>Options</h3>

                <Form>
                  <TextField
                    name="question_help_text"
                    type="text"
                  >
                    <Label>Help text</Label>
                    <Text
                      slot="description"
                      className="help"
                    >
                      Optionally, provide help text or additional context for this question.
                    </Text>
                    <Input />
                    <FieldError />
                  </TextField>

                  <Button type="submit">Create Question</Button>
                </Form>
              </TabPanel>
            </Tabs>

            <h2>Widgets</h2>
            <p>TBD (Custom Components, etc…)</p>

            <h2>Toggle Switch</h2>
            <p>
              This is a <em>core component</em>, see the{" "}
              <a href="https://react-spectrum.adobe.com/react-aria/Switch.html">component docs here.</a>
            </p>
            <Example>
              <Switch defaultSelected>
                <div className="indicator" />
                Toggle
              </Switch>
            </Example>

            <h2>Popover</h2>
            <p>
              This is a <em>core component</em>, see the{" "}
              <a href="https://react-spectrum.adobe.com/react-aria/Popover.html">component docs here.</a>
            </p>
            <Example>
              <DialogTrigger>
                <Button>Settings</Button>
                <Popover>
                  <OverlayArrow>
                    <svg
                      width={12}
                      height={12}
                      viewBox="0 0 12 12"
                    >
                      <path d="M0 0 L6 6 L12 0" />
                    </svg>
                  </OverlayArrow>
                  <Dialog>
                    <div className="flex-col">
                      <Switch defaultSelected>
                        <div className="indicator" />
                        Wi-Fi
                      </Switch>
                      <Switch defaultSelected>
                        <div className="indicator" />
                        Bluetooth
                      </Switch>
                      <Switch>
                        <div className="indicator" />
                        Mute
                      </Switch>
                    </div>
                  </Dialog>
                </Popover>
              </DialogTrigger>
            </Example>

            <h2>Menu</h2>
            <p>
              This is a <em>core component</em>, see the{" "}
              <a href="https://react-spectrum.adobe.com/react-aria/Menu.html">component docs here.</a>
            </p>
            <Example>
              <MenuTrigger>
                <Button aria-label="Menu">☰ Menu</Button>
                <Popover>
                  <Menu>
                    <MenuItem onAction={() => alert("open")}>Open</MenuItem>
                    <MenuItem onAction={() => alert("rename")}>Rename…</MenuItem>
                    <MenuItem onAction={() => alert("duplicate")}>Duplicate</MenuItem>
                    <MenuItem onAction={() => alert("share")}>Share…</MenuItem>
                    <MenuItem onAction={() => alert("delete")}>Delete…</MenuItem>
                  </Menu>
                </Popover>
              </MenuTrigger>
            </Example>
          </div>

          <div id="_tooltipWithDialog">
            <h2>Tooltip with dialog</h2>
            <p>This tooltip displays a message when a user hovers over the icon that is passed to TooltipWithDialog.</p>
            <p>
              Users can also pass in the tooltip message, as well as the modal that they want displayed when the user
              clicks the icon.
            </p>
            <Example>
              <TooltipWithDialog
                text="You have an existing connection to ORCID."
                tooltipText="Disconnect your account from ORCID. You can reconnect at any time."
                icon={<DmpIcon icon="cancel" />}
                onPressAction={handleDelete}
              >
                <ModalOverlayComponent
                  heading="Confirm deletion"
                  content="Are you sure you want to disconnect your ORCID ID?"
                  onPressAction={handleDelete}
                />
              </TooltipWithDialog>
            </Example>
          </div>

          <div id="_tinymce">
            <h2>TinyMCE Editor</h2>
            <p>Required properties:</p>
            <dl>
              <dt>
                <code>content</code>
              </dt>
              <dd>The variable that hold the html content for the editor.</dd>

              <dt>
                <code>setContent</code>
              </dt>
              <dd>The effect function that will update the content variable</dd>

              <dt>
                <code>Optional props</code>
              </dt>
              <dd>
                <p>
                  The <code>error</code> and <code>helpText</code> adds text below the editor.
                </p>
                <p>
                  And the <code>id</code> is added to the editor tag, and the <code>labelid</code> is used for an
                  aria-labelledby
                </p>
              </dd>
            </dl>
            <p>Example Usage:</p>
            <TinyMCEEditor
              content={editorContent}
              setContent={setEditorContent}
              error={undefined}
              id="tinymce-test"
              labelId="_tinymce"
              helpText="This is using the tinyMCE editor component"
            />
          </div>

          <div id="_toast">
            <h2>Toast Messages</h2>
            <p>
              Toast messages are used to provide brief, non-intrusive feedback to users about an action they&apos;ve
              taken within an application. For instance, if they successfully submit a form, we want to give them some
              feedback to reassure them that the change went through successfully.
            </p>
            <p>
              To implement toast messages in our app, we are using <strong>useToast React Aria Component</strong>.
              Documentation about this can be found here:{" "}
              <a href="https://react-spectrum.adobe.com/react-aria/useToast.html">
                https://react-spectrum.adobe.com/react-aria/useToast.html
              </a>
              . We chose to implement this option because it helps make toast messages accessible by:
            </p>
            <ul>
              <li>
                rendering a <em>landmark region</em>, which keyboard users can easily jump to
              </li>
              <li>to restore focus to where it was before navigating to the toast</li>
              <li>and use of ARIA roles and attributes</li>
            </ul>

            <h3>Toast Types</h3>
            <p>There are three different types of toasts: info, success, and error.</p>
            <ul style={{ listStyleType: "none" }}>
              <li style={{ marginTop: "15px" }}>
                <Button
                  onPress={() =>
                    toastState.add("This is an INFO message", { type: "info", key: "info", timeout: 5000 })
                  }
                >
                  Show info toast
                </Button>
              </li>
              <li style={{ marginTop: "15px" }}>
                <Button
                  onPress={() =>
                    toastState.add("This is a SUCCESS message", { type: "success", key: "success", timeout: 5000 })
                  }
                >
                  Show success toast
                </Button>
              </li>
              <li style={{ marginTop: "15px" }}>
                <Button
                  onPress={() =>
                    toastState.add("This is an ERROR message", { type: "error", key: "error", timeout: 5000 })
                  }
                >
                  Show error toast
                </Button>
              </li>
            </ul>

            <h3>Toast Options</h3>
            <p>
              There is the option to set a timeout for the toast message. The default timeout is currently set to 5
              seconds.{" "}
            </p>
            <div>
              <Button onPress={() => toastState.add("Toast is done!", { timeout: 1000 })}>
                Show toast with timeout of 1 second
              </Button>
            </div>
            <p>
              There is also the option to set a priority. The highest priority will sit at the top. Currently, the toast
              messages are configured to show a max of three messages at a time.
            </p>
            <div>
              <Button onPress={() => toastState.add("Highest priority!", { priority: 1 })}>
                Show toast with High Priority
              </Button>
            </div>
            <p>Toast messages even stay around after a page redirect.</p>
            <div>
              <Button onPress={showToastAndRedirect}>Show toast with redirect</Button>
            </div>
          </div>

          <div id="_questionpreview">
            <h3>QuestionPreview</h3>
            <QuestionPreview previewDisabled={false}>
              <LayoutWithPanel>
                <ContentContainer className="question-preview-container">
                  <p>This is an example of the content within the Question Preview</p>

                  <TextField
                    name="example_email"
                    type="email"
                    isRequired
                  >
                    <Label>Email</Label>
                    <Text
                      slot="description"
                      className="help"
                    >
                      Descriptive text related to the field
                    </Text>
                    <Input />
                    <FieldError />
                  </TextField>

                  <TinyMCEEditor
                    id="question-editor-preview"
                    content="<p>Example richtext field inside the preview bottomsheet</p>"
                    setContent={() => { }}
                  />
                </ContentContainer>

                <SidebarPanel>
                  <p>Best practice by (DMPTool Logo)</p>

                  <h3>Data Sharing</h3>
                  <p>
                    Give a summary of the data you will collect or create, noting the content, coverage and data type,
                    for example tabular data, survey data, experimental measurements, models, software, audiovisual
                    data, physical samples, etc.
                  </p>
                  <p>
                    <a href="#">Expand</a>
                  </p>

                  <h3>Data Preservation</h3>
                  <p>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus imperdiet tempor mi, in fringilla
                    lectus viverra et. Suspendisse erat dolor, rutrum et tempor eu, ultricies quis nunc.
                  </p>
                  <p>
                    <a href="#">Expand</a>
                  </p>

                  <h3>Data Protection</h3>
                  <p>Quisque sit amet ex volutpat, imperdiet risus sit amet, malesuada enim.</p>
                  <p>
                    <a href="#">Expand</a>
                  </p>
                </SidebarPanel>
              </LayoutWithPanel>
            </QuestionPreview>
          </div>

          <div id="_fundersearch">
            <h3>Funder Search</h3>
            <FunderSearch
              onResults={onFunderResults}
              moreTrigger={moreCounter}
            />

            <div id="_fundersearchResults">
              <h4>Results</h4>
              <ul>
                {funders.length === 0 && <li>No results</li>}
                {funders.map((res) => (
                  <li key={res.id}>
                    <strong>{res.displayName}</strong>
                    <br />
                    <small>{res.uri}</small>
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => setMoreCounter(moreCounter + 1)}
                aria-label="Load more funders"
              >
                Load More
              </Button>
            </div>
          </div>
        </ContentContainer>
      </LayoutWithPanel>
    </>
  );
}

export default Page;
