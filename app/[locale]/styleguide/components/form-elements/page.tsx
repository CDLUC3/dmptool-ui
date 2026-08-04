"use client";

import React from "react";
import Link from "next/link";
import type { CurrencyQuestionType } from "@dmptool/types";
import { ContentContainer, LayoutContainer } from "@/components/Container";
import { CurrencyQuestionComponent } from "@/components/Form/QuestionComponents";

// Import our custom Form components
import {
  FormInput,
  FormTextArea,
  FormSelect,
  CheckboxGroupComponent,
  RadioGroupComponent,
  DateComponent,
  NumberComponent,
  RangeComponent,
  MultiSelect,
  TypeAheadSearch,
} from "@/components/Form";

// Import React Aria components for checkbox and radio examples
import { Checkbox, Radio, ListBoxItem } from "react-aria-components";

// Import React Aria components for comparison

import {
  SGComponentExample,
  SGComponentExampleHeader,
  SGComponentExampleContent,
  SGComponentExampleDemo,
  SGCodeBlock,
  SGPropsTable,
  SGTocGrid,
  SGTocSection,
  SGGuidelinesGrid,
  SGGuidelineItem,
} from "../../shared/components";
import "../../shared/styleguide.scss";

export default function FormElementsPage() {
  // State for interactive examples
  const [selectedRadio, setSelectedRadio] = React.useState("planning");
  const [selectedCheckboxes, setSelectedCheckboxes] = React.useState<string[]>(["email"]);
  const [selectedCountry, setSelectedCountry] = React.useState<string>("us");
  const [textAreaValue, setTextAreaValue] = React.useState<string>("This is sample text in the textarea...");
  const [richTextValue, setRichTextValue] = React.useState<string>(
    "<p>This is <strong>rich text</strong> with <em>formatting</em>.</p>",
  );
  const [numberValue, setNumberValue] = React.useState<number>(100);
  const [currencyValue, setCurrencyValue] = React.useState<number | null>(250000);
  const [currencyStepperValue, setCurrencyStepperValue] = React.useState<number | null>(250000);
  const [currencyMaximumValue, setCurrencyMaximumValue] = React.useState<number | null>(100_000_000);
  const [currencyMinorUnitValue, setCurrencyMinorUnitValue] = React.useState<number | null>(250000);
  const [sterlingValue, setSterlingValue] = React.useState<number | null>(250000);
  const [euroValue, setEuroValue] = React.useState<number | null>(250000);
  const [polishZlotyValue, setPolishZlotyValue] = React.useState<number | null>(250000);
  const [brazilianRealValue, setBrazilianRealValue] = React.useState<number | null>(250000);
  const [dateValue, setDateValue] = React.useState<string | null>(null);
  const [rangeStart, setRangeStart] = React.useState<string>("Minimum Value");
  const [rangeEnd, setRangeEnd] = React.useState<string>("Maximum Value");

  // State for text input examples
  const [textInputValue, setTextInputValue] = React.useState<string>("");
  const [emailInputValue, setEmailInputValue] = React.useState<string>("");
  const [showTextError, setShowTextError] = React.useState<boolean>(false);
  const [showEmailError, setShowEmailError] = React.useState<boolean>(false);

  // Data for FormSelect
  const countries = [
    { id: "us", name: "United States" },
    { id: "uk", name: "United Kingdom" },
    { id: "ca", name: "Canada" },
    { id: "au", name: "Australia" },
  ];

  const currencyQuestion: CurrencyQuestionType = {
    type: "currency",
    meta: { schemaVersion: "1.0" },
    attributes: {
      denomination: "USD",
      min: 0,
      max: 100_000_000,
      step: 100,
    },
  };

  const sterlingQuestion: CurrencyQuestionType = {
    ...currencyQuestion,
    attributes: {
      ...currencyQuestion.attributes,
      denomination: "GBP",
    },
  };

  const euroQuestion: CurrencyQuestionType = {
    ...currencyQuestion,
    attributes: {
      ...currencyQuestion.attributes,
      denomination: "EUR",
    },
  };

  const polishZlotyQuestion: CurrencyQuestionType = {
    ...currencyQuestion,
    attributes: {
      ...currencyQuestion.attributes,
      denomination: "PLN",
    },
  };

  const brazilianRealQuestion: CurrencyQuestionType = {
    ...currencyQuestion,
    attributes: {
      ...currencyQuestion.attributes,
      denomination: "BRL",
    },
  };

  return (
    <LayoutContainer>
      <ContentContainer>
        <nav
          className="breadcrumbs"
          aria-label="Breadcrumb"
        >
          <Link href="/styleguide">Style Guide</Link>
          <span aria-hidden="true"> / </span>
          <Link href="/styleguide/components">Components</Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">Form Elements</span>
        </nav>

        <h1>Form Elements</h1>
        <p className="lead">
          Form components built on React Aria with our custom abstractions for consistent styling and behavior.
        </p>

        {/* Table of Contents */}
        <section id="table-of-contents">
          <h2>Contents</h2>
          <SGTocGrid>
            <SGTocSection title="Text Inputs">
              <ul>
                <li>
                  <a href="#text-input">Text Input</a>
                </li>
                <li>
                  <a href="#password-input">Password Input</a>
                </li>
                <li>
                  <a href="#textarea">Text Area</a>
                </li>
                <li>
                  <a href="#number-input">Number Input</a>
                </li>
              </ul>
            </SGTocSection>
            <SGTocSection title="Selection">
              <ul>
                <li>
                  <a href="#select">Select Dropdown</a>
                </li>
                <li>
                  <a href="#multiselect">Multi-Select</a>
                </li>
                <li>
                  <a href="#typeahead">Type-ahead Search</a>
                </li>
              </ul>
            </SGTocSection>
            <SGTocSection title="Choice Controls">
              <ul>
                <li>
                  <a href="#checkboxes">Checkboxes</a>
                </li>
                <li>
                  <a href="#radio-buttons">Radio Buttons</a>
                </li>
              </ul>
            </SGTocSection>
            <SGTocSection title="Specialized">
              <ul>
                <li>
                  <a href="#date-picker">Date Picker</a>
                </li>
                <li>
                  <a href="#range-input">Range Input Fields</a>
                </li>
                <li>
                  <a href="#messages">Messages</a>
                </li>
                <li>
                  <a href="#toast-messages">Toast Messages</a>
                </li>
              </ul>
            </SGTocSection>
          </SGTocGrid>
        </section>

        {/* Text Input */}
        <section id="text-input">
          <h2>Text Input</h2>
          <p>Standard text input field with label, validation, and help text support.</p>

          <SGComponentExample>
            <SGComponentExampleHeader title="Interactive Text Input Example" />
            <SGComponentExampleContent>
              <SGComponentExampleDemo>
                <h4>Standard Text Input</h4>
                <FormInput
                  name="example-input"
                  label="Full Name"
                  placeholder="Enter your full name"
                  description="This will be displayed on your profile"
                />

                <h4>Text Input with Error State</h4>
                <FormInput
                  name="example-input-error"
                  label="Required Field"
                  placeholder="This field is required"
                  description="Try leaving this empty and clicking the button below"
                  value={textInputValue}
                  onChange={(e) => setTextInputValue(e.target.value)}
                  isInvalid={showTextError}
                  errorMessage="This field is required and cannot be empty"
                  isRequired={true}
                />
                <button
                  type="button"
                  onClick={() => setShowTextError(!textInputValue.trim())}
                  style={{ marginTop: "0.5rem", padding: "0.5rem 1rem" }}
                >
                  {showTextError ? "Clear Error" : "Validate Field"}
                </button>

                <h4>Email Input with Validation</h4>
                <FormInput
                  name="example-email"
                  type="email"
                  label="Email Address"
                  placeholder="Enter your email address"
                  description="We'll use this to send you updates"
                  value={emailInputValue}
                  onChange={(e) => {
                    setEmailInputValue(e.target.value);
                    // Auto-validate email format
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    setShowEmailError(e.target.value.length > 0 && !emailRegex.test(e.target.value));
                  }}
                  isInvalid={showEmailError}
                  errorMessage="Please enter a valid email address"
                />
                {emailInputValue && !showEmailError && (
                  <p style={{ color: "green", fontSize: "0.875rem", marginTop: "0.25rem" }}>✓ Valid email format</p>
                )}
              </SGComponentExampleDemo>

              <h4>Usage</h4>
              <SGCodeBlock>{`import { FormInput } from '@/components/Form';

// Standard text input
<FormInput
  name="fullName"
  label="Full Name"
  placeholder="Enter your full name"
  description="This will be displayed on your profile"
  isRequired
/>

// Text input with error state
<FormInput
  name="requiredField"
  label="Required Field"
  placeholder="This field is required"
  value={inputValue}
  onChange={(e) => setInputValue(e.target.value)}
  isInvalid={showError}
  errorMessage="This field is required and cannot be empty"
  isRequired
/>

// Email input with validation
<FormInput
  name="email"
  type="email"
  label="Email Address"
  placeholder="Enter your email address"
  value={emailValue}
  onChange={(e) => {
    setEmailValue(e.target.value);
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setShowEmailError(e.target.value.length > 0 && !emailRegex.test(e.target.value));
  }}
  isInvalid={showEmailError}
  errorMessage="Please enter a valid email address"
/>`}</SGCodeBlock>

              <h4>React Aria Base</h4>
              <p>
                Built using React Aria&apos;s <code>TextField</code>, <code>Input</code>, <code>Label</code>, and{" "}
                <code>FieldError</code> components for comprehensive form validation and accessibility.
              </p>
            </SGComponentExampleContent>
          </SGComponentExample>
        </section>

        {/* Password Input */}
        <section id="password-input">
          <h2>Password Input</h2>
          <p>
            Password fields use <code>FormInput</code> with a Show/Hide link beside the input. The toggle is on by
            default when <code>type=&quot;password&quot;</code>.
          </p>

          <SGComponentExample>
            <SGComponentExampleHeader title="Password Input Variants" />
            <SGComponentExampleContent>
              <SGComponentExampleDemo>
                <h4>Standard (hidden by default)</h4>
                <FormInput
                  name="password-standard"
                  type="password"
                  label="Password"
                  placeholder="Enter your password"
                  isRequired
                />

                <h4>Visible by default</h4>
                <FormInput
                  name="password-visible"
                  type="password"
                  label="Password"
                  placeholder="Enter your password"
                  defaultPasswordVisible={true}
                  isRequired
                />

                <h4>No toggle</h4>
                <FormInput
                  name="password-no-toggle"
                  type="password"
                  label="Password"
                  placeholder="Enter your password"
                  showPasswordToggle={false}
                  isRequired
                />
              </SGComponentExampleDemo>

              <h4>Usage</h4>
              <SGCodeBlock>{`import { FormInput } from '@/components/Form';

// Standard — toggle on, password hidden
<FormInput
  name="password"
  type="password"
  label="Password"
  isRequired
/>

// Visible by default
<FormInput
  name="password"
  type="password"
  label="Password"
  defaultPasswordVisible={true}
  isRequired
/>

// No Show/Hide toggle
<FormInput
  name="password"
  type="password"
  label="Password"
  showPasswordToggle={false}
  isRequired
/>`}</SGCodeBlock>

              <h4>Props</h4>
              <SGPropsTable>
                <thead>
                  <tr>
                    <th>Prop</th>
                    <th>Type</th>
                    <th>Default</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <code>showPasswordToggle</code>
                    </td>
                    <td>
                      <code>boolean</code>
                    </td>
                    <td>
                      <code>true</code> when <code>type=&quot;password&quot;</code>
                    </td>
                    <td>Render the Show/Hide link beside the field</td>
                  </tr>
                  <tr>
                    <td>
                      <code>defaultPasswordVisible</code>
                    </td>
                    <td>
                      <code>boolean</code>
                    </td>
                    <td>
                      <code>false</code>
                    </td>
                    <td>Start with the password shown as plain text</td>
                  </tr>
                </tbody>
              </SGPropsTable>
            </SGComponentExampleContent>
          </SGComponentExample>
        </section>

        {/* Text Area */}
        <section id="textarea">
          <h2>Text Area</h2>
          <p>Multi-line text input for longer content, with optional rich text editing.</p>

          <SGComponentExample>
            <SGComponentExampleHeader title="Text Area Components" />
            <SGComponentExampleContent>
              <SGComponentExampleDemo>
                <h4>Standard Text Area</h4>
                <FormTextArea
                  name="example-textarea"
                  label="Description"
                  placeholder="Enter a detailed description..."
                  description="Provide as much detail as possible"
                  value={textAreaValue}
                  onChange={setTextAreaValue}
                  richText={false}
                />
                <p>
                  <small>Characters: {textAreaValue.length}</small>
                </p>

                <h4>Rich Text Editor (WYSIWYG)</h4>
                <FormTextArea
                  name="example-richtext"
                  label="Rich Text Content"
                  description="Use the toolbar to format your text"
                  value={richTextValue}
                  onChange={setRichTextValue}
                  richText={true}
                />
                <details style={{ marginTop: "1rem", fontSize: "0.875rem" }}>
                  <summary>View HTML Output</summary>
                  <pre
                    style={{
                      background: "#f5f5f5",
                      padding: "0.5rem",
                      marginTop: "0.5rem",
                      fontSize: "0.75rem",
                      overflow: "auto",
                    }}
                  >
                    {richTextValue}
                  </pre>
                </details>
              </SGComponentExampleDemo>

              <h4>Usage</h4>
              <SGCodeBlock>{`import { FormTextArea } from '@/components/Form';

// Standard textarea
<FormTextArea
  name="description"
  label="Description"
  placeholder="Enter a detailed description..."
  value={textValue}
  onChange={setTextValue}
  richText={false}
/>

// Rich text editor
<FormTextArea
  name="content"
  label="Rich Content"
  value={richTextValue}
  onChange={setRichTextValue}
  richText={true}
/>`}</SGCodeBlock>

              <h4>React Aria Base</h4>
              <p>
                Built using React Aria&apos;s <code>TextField</code> and <code>TextArea</code> components, with TinyMCE
                integration for rich text editing.
              </p>
            </SGComponentExampleContent>
          </SGComponentExample>
        </section>

        {/* Number Input */}
        <section id="number-input">
          <h2>Number Input</h2>
          <p>Numeric input with validation and formatting.</p>

          <SGComponentExample>
            <SGComponentExampleHeader title="Number Input with +/- Controls" />
            <SGComponentExampleContent>
              <SGComponentExampleDemo>
                <NumberComponent
                  label="Budget Amount"
                  placeholder="0"
                  value={numberValue}
                  minValue={0}
                  maxValue={1000000}
                  step={10}
                  onChange={setNumberValue}
                />
                <p>
                  <small>Current value: {numberValue}</small>
                </p>
              </SGComponentExampleDemo>

              <h4>Usage</h4>
              <SGCodeBlock>{`import { NumberComponent } from '@/components/Form';

<NumberComponent
  label="Budget Amount"
  placeholder="0"
  value={budgetValue}
  minValue={0}
  maxValue={1000000}
  step={10}
  onChange={setBudgetValue}
/>`}</SGCodeBlock>
            </SGComponentExampleContent>
          </SGComponentExample>

          <SGComponentExample>
            <SGComponentExampleHeader title="Currency Field States" />
            <SGComponentExampleContent>
              <p>
                Currency fields use the shared number API with a wider input, an external currency prefix,
                and optional steppers. Steppers are off by default so manually entered values remain precise.
              </p>

              <SGComponentExampleDemo>
                <div className="form-row">
                  <CurrencyQuestionComponent
                    parsedQuestion={currencyQuestion}
                    inputCurrencyValue={currencyValue}
                    currencyLabel="Default USD field"
                    placeholder="Enter an amount"
                    handleCurrencyChange={setCurrencyValue}
                  />
                  <p>
                    <small>Current value: {currencyValue ?? "No value"}</small>
                  </p>
                </div>

                <div className="form-row">
                  <CurrencyQuestionComponent
                    parsedQuestion={currencyQuestion}
                    inputCurrencyValue={currencyStepperValue}
                    currencyLabel="USD field with optional $100 steppers"
                    placeholder="Enter an amount"
                    handleCurrencyChange={setCurrencyStepperValue}
                    showSteppers
                  />
                  <p>
                    <small>Current value: {currencyStepperValue ?? "No value"}</small>
                  </p>
                </div>

                <div className="form-row">
                  <CurrencyQuestionComponent
                    parsedQuestion={currencyQuestion}
                    inputCurrencyValue={currencyMaximumValue}
                    currencyLabel="Maximum value (decrement to leave boundary)"
                    handleCurrencyChange={setCurrencyMaximumValue}
                    showSteppers
                  />
                  <p>
                    <small>Current value: {currencyMaximumValue ?? "No value"}</small>
                  </p>
                </div>

                <div className="form-row">
                  <CurrencyQuestionComponent
                    parsedQuestion={currencyQuestion}
                    inputCurrencyValue={currencyMinorUnitValue}
                    currencyLabel="Minor units enabled"
                    handleCurrencyChange={setCurrencyMinorUnitValue}
                    showMinorUnits
                  />
                  <p>
                    <small>Current value: {currencyMinorUnitValue ?? "No value"}</small>
                  </p>
                </div>

                <div className="form-row">
                  <CurrencyQuestionComponent
                    parsedQuestion={currencyQuestion}
                    inputCurrencyValue={250000}
                    currencyLabel="Disabled currency field"
                    handleCurrencyChange={() => undefined}
                    isDisabled
                  />
                </div>

                <div className="form-row">
                  <CurrencyQuestionComponent
                    parsedQuestion={sterlingQuestion}
                    inputCurrencyValue={sterlingValue}
                    currencyLabel="Alternate denomination (GBP)"
                    handleCurrencyChange={setSterlingValue}
                  />
                  <p>
                    <small>Current value: {sterlingValue ?? "No value"}</small>
                  </p>
                </div>

                <div className="form-row">
                  <CurrencyQuestionComponent
                    parsedQuestion={euroQuestion}
                    inputCurrencyValue={euroValue}
                    currencyLabel="Euro with German formatting (250.000,00 €)"
                    handleCurrencyChange={setEuroValue}
                    locale="de-DE"
                    symbolPosition="suffix"
                    showMinorUnits
                  />
                  <p>
                    <small>Current value: {euroValue ?? "No value"}</small>
                  </p>
                </div>

                <div className="form-row">
                  <CurrencyQuestionComponent
                    parsedQuestion={polishZlotyQuestion}
                    inputCurrencyValue={polishZlotyValue}
                    currencyLabel="Polish złoty (PLN) with 100-unit steppers"
                    handleCurrencyChange={setPolishZlotyValue}
                    locale="pl-PL"
                    symbolPosition="suffix"
                    showSteppers
                  />
                  <p>
                    <small>Current value: {polishZlotyValue ?? "No value"}</small>
                  </p>
                </div>

                <div className="form-row">
                  <CurrencyQuestionComponent
                    parsedQuestion={brazilianRealQuestion}
                    inputCurrencyValue={brazilianRealValue}
                    currencyLabel="Brazilian real (BRL, pt-BR)"
                    handleCurrencyChange={setBrazilianRealValue}
                    locale="pt-BR"
                    showMinorUnits
                  />
                  <p>
                    <small>Current value: {brazilianRealValue ?? "No value"}</small>
                  </p>
                </div>
              </SGComponentExampleDemo>

              <h4>Currency API</h4>
              <SGCodeBlock>{`const currencyQuestion = {
  type: 'currency',
  meta: { schemaVersion: '1.0' },
  attributes: {
    denomination: 'USD',
    min: 0,
    max: 100_000_000,
    step: 100,
  },
};

<CurrencyQuestionComponent
  parsedQuestion={currencyQuestion}
  inputCurrencyValue={currencyValue}
  currencyLabel="Budget"
  handleCurrencyChange={setCurrencyValue}
  showSteppers={false} // optional; defaults to false
  showMinorUnits={false} // optional; defaults to false
  symbolPosition="prefix" // optional; prefix or suffix
  locale="en-US" // optional; use pt-BR for Brazilian formatting
/>`}</SGCodeBlock>
            </SGComponentExampleContent>
          </SGComponentExample>
        </section>

        {/* Select */}
        <section id="select">
          <h2>Select Dropdown</h2>
          <p>Dropdown selection with search and keyboard navigation.</p>

          <SGComponentExample>
            <SGComponentExampleHeader title="Searchable Select Dropdown" />
            <SGComponentExampleContent>
              <SGComponentExampleDemo>
                <FormSelect
                  label="Country"
                  placeholder="Select a country"
                  description="Choose your country of residence"
                  items={countries}
                  selectedKey={selectedCountry}
                  onChange={(selected) => setSelectedCountry(selected as string)}
                >
                  {(item) => <ListBoxItem key={item.id}>{item.name}</ListBoxItem>}
                </FormSelect>
                <p>
                  <small>Selected: {countries.find((c) => c.id === selectedCountry)?.name}</small>
                </p>
              </SGComponentExampleDemo>

              <h4>Usage</h4>
              <SGCodeBlock>{`import { FormSelect } from '@/components/Form';

<FormSelect
  label="Country"
  placeholder="Select a country"
  items={countries}
  selectedKey={selectedCountry}
  onChange={(selected) => setSelectedCountry(selected as string)}
>
  {(item) => <ListBoxItem key={item.id}>{item.name}</ListBoxItem>}
</FormSelect>`}</SGCodeBlock>

              <h4>React Aria Base</h4>
              <p>
                Built using React Aria&apos;s <code>Select</code>, <code>ListBox</code>, and <code>Popover</code>{" "}
                components.
              </p>
            </SGComponentExampleContent>
          </SGComponentExample>
        </section>

        {/* Multi-Select */}
        <section id="multiselect">
          <h2>Multi-Select</h2>
          <p>Select multiple options with tag display and removal.</p>

          <SGComponentExample>
            <SGComponentExampleHeader title="Multi-Select with Visual Tags" />
            <SGComponentExampleContent>
              <SGComponentExampleDemo>
                <MultiSelect
                  label="Skills"
                  options={[
                    { id: "react", name: "React" },
                    { id: "typescript", name: "TypeScript" },
                    { id: "node", name: "Node.js" },
                    { id: "python", name: "Python" },
                  ]}
                />
              </SGComponentExampleDemo>

              <h4>Usage</h4>
              <SGCodeBlock>{`import { MultiSelect } from '@/components/Form';

<MultiSelect
  name="skills"
  label="Skills"
  placeholder="Select your skills"
  options={[
    { id: "react", name: "React" },
    { id: "typescript", name: "TypeScript" },
    // ...
  ]}
  selectedKeys={selectedSkills}
  onSelectionChange={setSelectedSkills}
/>`}</SGCodeBlock>
            </SGComponentExampleContent>
          </SGComponentExample>
        </section>

        {/* Type-ahead Search */}
        <section id="typeahead">
          <h2>Type-ahead Search</h2>
          <p>Search and select from large datasets with autocomplete.</p>

          <SGComponentExample>
            <SGComponentExampleHeader title="Autocomplete Search Field" />
            <SGComponentExampleContent>
              <SGComponentExampleDemo>
                <TypeAheadSearch
                  typeaheadSearchLabel="Institution Search"
                  typeaheadHelpText="Start typing to search for your institution"
                  labelText="Institution Label"
                  labelTextPlaceholder="Enter label..."
                  helpText="Help Text"
                  helpTextPlaceholder="Enter help text..."
                  handleTypeAheadSearchLabelChange={(value) => console.log("Label:", value)}
                  handleTypeAheadHelpTextChange={(value) => console.log("Help:", value)}
                />
              </SGComponentExampleDemo>

              <h4>Usage</h4>
              <SGCodeBlock>{`import { TypeAheadSearch } from '@/components/Form';

<TypeAheadSearch
  name="institution"
  label="Institution"
  placeholder="Start typing to search..."
  onSearch={handleSearch}
  onSelect={handleSelect}
/>`}</SGCodeBlock>

              <h4>React Aria Base</h4>
              <p>
                Built using React Aria&apos;s <code>ComboBox</code> and related components.
              </p>
            </SGComponentExampleContent>
          </SGComponentExample>
        </section>

        {/* Checkboxes */}
        <section id="checkboxes">
          <h2>Checkboxes</h2>
          <p>Multiple choice selection with individual or group validation.</p>

          <SGComponentExample>
            <SGComponentExampleHeader title="Interactive Checkbox Group" />
            <SGComponentExampleContent>
              <SGComponentExampleDemo>
                <CheckboxGroupComponent
                  name="example-checkboxes"
                  checkboxGroupLabel="Preferred Contact Methods"
                  checkboxGroupDescription="Select all methods you'd like us to use"
                  value={selectedCheckboxes}
                  onChange={setSelectedCheckboxes}
                >
                  <div key="email">
                    <Checkbox
                      value="email"
                      aria-label="checkbox"
                    >
                      <div className="checkbox">
                        <svg
                          viewBox="0 0 18 18"
                          aria-hidden="true"
                        >
                          <polyline points="1 9 7 14 15 4" />
                        </svg>
                      </div>
                      <div>
                        <span>Email</span>
                      </div>
                    </Checkbox>
                  </div>
                  <div key="phone">
                    <Checkbox
                      value="phone"
                      aria-label="checkbox"
                    >
                      <div className="checkbox">
                        <svg
                          viewBox="0 0 18 18"
                          aria-hidden="true"
                        >
                          <polyline points="1 9 7 14 15 4" />
                        </svg>
                      </div>
                      <div>
                        <span>Phone</span>
                      </div>
                    </Checkbox>
                  </div>
                  <div key="sms">
                    <Checkbox
                      value="sms"
                      aria-label="checkbox"
                    >
                      <div className="checkbox">
                        <svg
                          viewBox="0 0 18 18"
                          aria-hidden="true"
                        >
                          <polyline points="1 9 7 14 15 4" />
                        </svg>
                      </div>
                      <div>
                        <span>SMS</span>
                      </div>
                    </Checkbox>
                  </div>
                  <div key="mail">
                    <Checkbox
                      value="mail"
                      aria-label="checkbox"
                    >
                      <div className="checkbox">
                        <svg
                          viewBox="0 0 18 18"
                          aria-hidden="true"
                        >
                          <polyline points="1 9 7 14 15 4" />
                        </svg>
                      </div>
                      <div>
                        <span>Postal Mail</span>
                      </div>
                    </Checkbox>
                  </div>
                </CheckboxGroupComponent>
                <p>
                  <small>Selected: {selectedCheckboxes.join(", ") || "None"}</small>
                </p>
              </SGComponentExampleDemo>

              <h4>Usage</h4>
              <SGCodeBlock>{`import { CheckboxGroupComponent } from '@/components/Form';

<CheckboxGroupComponent
  name="contactMethods"
  checkboxGroupLabel="Preferred Contact Methods"
  value={selectedMethods}
  onChange={setSelectedMethods}
>
  {checkboxData.map((checkbox, index) => (
    <div key={index}>
      <Checkbox value={checkbox.value} aria-label="checkbox">
        <div className="checkbox">
          <svg viewBox="0 0 18 18" aria-hidden="true">
            <polyline points="1 9 7 14 15 4" />
          </svg>
        </div>
        <div>
          <span>{checkbox.label}</span>
        </div>
      </Checkbox>
    </div>
  ))}
</CheckboxGroupComponent>`}</SGCodeBlock>

              <h4>React Aria Base</h4>
              <p>
                Built using React Aria&apos;s <code>CheckboxGroup</code> and <code>Checkbox</code> components.
              </p>
            </SGComponentExampleContent>
          </SGComponentExample>
        </section>

        {/* Radio Buttons */}
        <section id="radio-buttons">
          <h2>Radio Buttons</h2>
          <p>Single choice selection from a group of options.</p>

          <SGComponentExample>
            <SGComponentExampleHeader title="Interactive Radio Button Group" />
            <SGComponentExampleContent>
              <SGComponentExampleDemo>
                <RadioGroupComponent
                  name="example-radio"
                  radioGroupLabel="Project Status"
                  value={selectedRadio}
                  onChange={setSelectedRadio}
                >
                  <div key="planning">
                    <Radio value="planning">Planning</Radio>
                  </div>
                  <div key="active">
                    <Radio value="active">Active</Radio>
                  </div>
                  <div key="completed">
                    <Radio value="completed">Completed</Radio>
                  </div>
                  <div key="on-hold">
                    <Radio value="on-hold">On Hold</Radio>
                  </div>
                </RadioGroupComponent>
                <p>
                  <small>Selected: {selectedRadio}</small>
                </p>
              </SGComponentExampleDemo>

              <h4>Usage</h4>
              <SGCodeBlock>{`import { RadioGroupComponent } from '@/components/Form';

<RadioGroupComponent
  name="projectStatus"
  radioGroupLabel="Project Status"
  value={status}
  onChange={setStatus}
>
  {radioButtonData.map((radioButton, index) => (
    <div key={index}>
      <Radio value={radioButton.value}>{radioButton.label}</Radio>
    </div>
  ))}
</RadioGroupComponent>`}</SGCodeBlock>

              <h4>React Aria Base</h4>
              <p>
                Built using React Aria&apos;s <code>RadioGroup</code> and <code>Radio</code> components.
              </p>
            </SGComponentExampleContent>
          </SGComponentExample>
        </section>

        {/* Date Picker */}
        <section id="date-picker">
          <h2>Date Picker</h2>
          <p>Calendar-based date selection with keyboard navigation and validation.</p>

          <SGComponentExample>
            <SGComponentExampleHeader title="Calendar Date Picker" />
            <SGComponentExampleContent>
              <SGComponentExampleDemo>
                <DateComponent
                  name="example-date"
                  label="Project Start Date"
                  value={dateValue}
                  onChange={setDateValue}
                />
                <p>
                  <small>Selected date: {dateValue ? dateValue.toString() : "None"}</small>
                </p>
              </SGComponentExampleDemo>

              <h4>Usage</h4>
              <SGCodeBlock>{`import { DateComponent } from '@/components/Form';

<DateComponent
  name="startDate"
  label="Project Start Date"
  description="Select when your project will begin"
  value={startDate}
  onChange={setStartDate}
/>`}</SGCodeBlock>

              <h4>React Aria Base</h4>
              <p>
                Built using React Aria&apos;s <code>DatePicker</code>, <code>Calendar</code>, and related components.
              </p>
            </SGComponentExampleContent>
          </SGComponentExample>
        </section>

        {/* Range Input Fields */}
        <section id="range-input">
          <h2>Range Input Fields</h2>
          <p>Paired text inputs for defining start and end values or ranges.</p>

          <SGComponentExample>
            <SGComponentExampleHeader title="Paired Range Input Fields" />
            <SGComponentExampleContent>
              <SGComponentExampleDemo>
                <RangeComponent
                  startLabel={rangeStart}
                  endLabel={rangeEnd}
                  handleRangeLabelChange={(field, value) => {
                    if (field === "start") setRangeStart(value);
                    if (field === "end") setRangeEnd(value);
                  }}
                />
                <p>
                  <small>
                    Range: &quot;{rangeStart}&quot; to &quot;{rangeEnd}&quot;
                  </small>
                </p>
              </SGComponentExampleDemo>

              <h4>Usage</h4>
              <SGCodeBlock>{`import { RangeComponent } from '@/components/Form';

<RangeComponent
  startLabel={startValue}
  endLabel={endValue}
  handleRangeLabelChange={(field, value) => {
    if (field === 'start') setStartValue(value);
    if (field === 'end') setEndValue(value);
  }}
/>`}</SGCodeBlock>

              <h4>React Aria Base</h4>
              <p>
                Built using our <code>FormInput</code> components in a paired layout for range definitions.
              </p>
            </SGComponentExampleContent>
          </SGComponentExample>
        </section>

        {/* Toast Messages */}
        <section id="toast-messages">
          <SGComponentExample>
            <SGComponentExampleHeader title="Toast Messages" />
            <SGComponentExampleContent>
              <p>
                Toast messages provide temporary feedback to users about actions they&apos;ve taken. Built with React
                Aria for accessibility and proper focus management.
              </p>

              <SGComponentExampleDemo>
                <h4>Toast Types</h4>
                <div style={{ display: "grid", gap: "1rem", marginBottom: "2rem" }}>
                  <div
                    className="toast toast-info"
                    style={{ position: "relative", transform: "none" }}
                  >
                    <div>Information: Your changes have been saved as a draft.</div>
                    <button aria-label="Close toast">×</button>
                  </div>

                  <div
                    className="toast toast-success"
                    style={{ position: "relative", transform: "none" }}
                  >
                    <div>Success: Project published successfully!</div>
                    <button aria-label="Close toast">×</button>
                  </div>

                  <div
                    className="toast toast-error"
                    style={{ position: "relative", transform: "none" }}
                  >
                    <div>Error: Unable to save changes. Please try again.</div>
                    <button aria-label="Close toast">×</button>
                  </div>
                </div>

                <h4>Usage</h4>
                <SGCodeBlock>{`import { useToast } from '@/context/ToastContext';

function MyComponent() {
  const toast = useToast();

  const handleSave = () => {
    // Perform save action
    toast.add("Changes saved successfully!", { 
      type: "success",
      timeout: 5000 
    });
  };

  const handleError = () => {
    toast.add("Something went wrong", { 
      type: "error",
      timeout: 8000 
    });
  };

  return (
    <div>
      <Button onPress={handleSave}>Save</Button>
      <Button onPress={handleError}>Trigger Error</Button>
    </div>
  );
}`}</SGCodeBlock>

                <h4>Toast Options</h4>
                <SGPropsTable>
                  <thead>
                    <tr>
                      <th>Option</th>
                      <th>Type</th>
                      <th>Default</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <code>type</code>
                      </td>
                      <td>
                        <code>&quot;info&quot; | &quot;success&quot; | &quot;error&quot; | &quot;warn&quot;</code>
                      </td>
                      <td>
                        <code>&quot;info&quot;</code>
                      </td>
                      <td>Visual style and semantic meaning</td>
                    </tr>
                    <tr>
                      <td>
                        <code>timeout</code>
                      </td>
                      <td>
                        <code>number</code>
                      </td>
                      <td>
                        <code>5000</code>
                      </td>
                      <td>Auto-dismiss time in milliseconds</td>
                    </tr>
                    <tr>
                      <td>
                        <code>priority</code>
                      </td>
                      <td>
                        <code>number</code>
                      </td>
                      <td>
                        <code>0</code>
                      </td>
                      <td>Display order priority</td>
                    </tr>
                  </tbody>
                </SGPropsTable>

                <h4>Best Practices</h4>
                <ul>
                  <li>
                    <strong>Keep messages concise:</strong> Users should quickly understand what happened
                  </li>
                  <li>
                    <strong>Use appropriate types:</strong> Success for completed actions, error for failures, info for
                    general feedback
                  </li>
                  <li>
                    <strong>Provide context:</strong> Include relevant details about what succeeded or failed
                  </li>
                  <li>
                    <strong>Consider timing:</strong> Error messages may need longer timeouts than success messages
                  </li>
                  <li>
                    <strong>Avoid overuse:</strong> Don&apos;t show toasts for every minor interaction
                  </li>
                </ul>

                <h4>Accessibility Features</h4>
                <ul>
                  <li>
                    <strong>ARIA roles:</strong> <code>alert</code> for errors, <code>status</code> for other types
                  </li>
                  <li>
                    <strong>Live regions:</strong> <code>aria-live=&quot;assertive&quot;</code> for errors,{" "}
                    <code>aria-live=&quot;polite&quot;</code> for others
                  </li>
                  <li>
                    <strong>Keyboard accessible:</strong> Close button can be focused and activated with keyboard
                  </li>
                  <li>
                    <strong>Screen reader friendly:</strong> Content is announced when toasts appear
                  </li>
                </ul>
              </SGComponentExampleDemo>
            </SGComponentExampleContent>
          </SGComponentExample>
        </section>

        {/* Implementation Guidelines */}
        <section id="implementation">
          <h2>Implementation Guidelines</h2>

          <SGGuidelinesGrid>
            <SGGuidelineItem title="Accessibility First">
              <p>
                All form components are built on React Aria for robust keyboard navigation, screen reader support, and
                ARIA compliance.
              </p>
            </SGGuidelineItem>
            <SGGuidelineItem title="Consistent API">
              <p>
                Our custom components provide a unified interface while leveraging React Aria&apos;s powerful primitives
                underneath.
              </p>
            </SGGuidelineItem>
            <SGGuidelineItem title="Validation Ready">
              <p>
                Built-in support for validation states, error messages, and help text to guide users through form
                completion.
              </p>
            </SGGuidelineItem>
            <SGGuidelineItem title="Responsive Design">
              <p>
                Form elements adapt to different screen sizes and input methods (touch, mouse, keyboard) automatically.
              </p>
            </SGGuidelineItem>
          </SGGuidelinesGrid>

          <h3>Common Props</h3>
          <p>Most form components share these common properties:</p>
          <ul>
            <li>
              <code>name</code> - Form field name for submission
            </li>
            <li>
              <code>label</code> - Accessible label text
            </li>
            <li>
              <code>description</code> - Help text displayed below the field
            </li>
            <li>
              <code>required</code> - Marks field as required with validation
            </li>
            <li>
              <code>disabled</code> - Disables interaction with the field
            </li>
            <li>
              <code>value</code> & <code>onChange</code> - Controlled component pattern
            </li>
          </ul>
        </section>
      </ContentContainer>
    </LayoutContainer>
  );
}
